import { getPaper } from "@/lib/server/paper-repository";
import { createComparison, getComparison, updateComparison } from "@/lib/server/comparison-repository";
import { createId, nowIso } from "@/lib/server/utils";
import { DEFAULT_USER_ID } from "@/lib/server/config";
import { generateComparisonReport } from "@/lib/server/services/comparison-service";
import type { ComparisonPaperSnapshot, ComparisonRecord, PaperRecord } from "@/lib/types";

function paperToSnapshot(paper: PaperRecord): ComparisonPaperSnapshot {
  return {
    paperId: paper.id,
    title: paper.title,
    oneLiner: paper.quickSummary?.one_liner ?? "论文未明确说明",
    coreProblem: paper.quickSummary?.core_problem ?? paper.deepSummary?.task.problem.content ?? "论文未明确说明",
    methodOverview:
      paper.quickSummary?.method_overview ?? paper.deepSummary?.task.objective.content ?? "论文未明确说明",
    keyFindings: paper.quickSummary?.key_findings ?? ["论文未明确说明"],
    challenges: paper.deepSummary?.challenge.map((item) => item.title) ?? [],
    novelties: paper.deepSummary?.insight_and_novelty.novelties.map((item) => item.title) ?? [],
    roleHint: "",
    sourceType: "inferred"
  };
}

async function safeUpdateComparison(
  comparisonId: string,
  updater: (comparison: ComparisonRecord) => ComparisonRecord | Promise<ComparisonRecord>
) {
  try {
    return await updateComparison(comparisonId, updater);
  } catch (error) {
    if (error instanceof Error && error.message.includes("was not found")) {
      return undefined;
    }

    throw error;
  }
}

export async function createComparisonTask(args: {
  paperIds: string[];
  focusPrompt: string;
}) {
  const uniquePaperIds = [...new Set(args.paperIds)].slice(0, 10);

  if (uniquePaperIds.length < 2) {
    throw new Error("至少需要选择 2 篇论文才能进行对比。");
  }

  if (uniquePaperIds.length > 10) {
    throw new Error("一次最多只能对比 10 篇论文。");
  }

  const papers = await Promise.all(uniquePaperIds.map((paperId) => getPaper(paperId)));

  if (papers.some((paper) => !paper)) {
    throw new Error("所选论文中存在已删除或不存在的记录。");
  }

  const readyPapers = papers as PaperRecord[];
  const invalidPaper = readyPapers.find(
    (paper) => paper.status !== "ready" || paper.summaryStatus !== "ready" || !paper.quickSummary || !paper.deepSummary
  );

  if (invalidPaper) {
    throw new Error(`论文《${invalidPaper.title}》尚未完成总结，当前不能加入多论文对比。`);
  }

  const snapshots = readyPapers.map(paperToSnapshot);
  const timestamp = nowIso();
  const title =
    args.focusPrompt.trim() || `${snapshots[0]?.title ?? "多论文"} 等 ${snapshots.length} 篇综述`;
  const comparison: ComparisonRecord = {
    id: createId("cmp"),
    userId: DEFAULT_USER_ID,
    title,
    paperIds: uniquePaperIds,
    focusPrompt: args.focusPrompt.trim() || "从这组论文中梳理研究现状、联系、差异与矛盾。",
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    paperSnapshots: snapshots,
    chatMessages: []
  };

  await createComparison(comparison);
  return comparison;
}

export async function processComparison(comparisonId: string) {
  const existing = await getComparison(comparisonId);

  if (!existing) {
    return;
  }

  try {
    const analyzing = await safeUpdateComparison(comparisonId, (comparison) => ({
      ...comparison,
      status: "analyzing",
      errorMessage: undefined
    }));

    if (!analyzing) {
      return;
    }

    const refreshed = await getComparison(comparisonId);

    if (!refreshed) {
      return;
    }

    const report = await generateComparisonReport({
      focusPrompt: refreshed.focusPrompt,
      papers: refreshed.paperSnapshots
    });

    await safeUpdateComparison(comparisonId, (comparison) => ({
      ...comparison,
      status: "ready",
      reportJson: report
    }));
  } catch (error) {
    await safeUpdateComparison(comparisonId, (comparison) => ({
      ...comparison,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误"
    }));
  }
}
