import {
  buildComparisonChatPrompt,
  buildComparisonReportPrompt
} from "@/lib/prompts/builders";
import { getComparison, appendComparisonChatMessages } from "@/lib/server/comparison-repository";
import { generateStructuredOutput } from "@/lib/server/services/structured-generation";
import { createId, nowIso, scoreTextMatch } from "@/lib/server/utils";
import {
  ComparisonReportSchema,
  type ComparisonReport,
  type ComparisonChatMessage,
  type ComparisonPaperSnapshot,
  type ComparisonRecord
} from "@/lib/types";
import { normalizeComparisonReportPayload } from "@/lib/server/services/comparison-normalizers";
import { z } from "zod";

const ComparisonChatAnswerSchema = z.object({
  answer: z.string().trim().min(1),
  supporting_paper_ids: z.array(z.string().trim().min(1)),
  supporting_sections: z.array(z.string().trim().min(1))
});

function buildComparisonTitle(papers: ComparisonPaperSnapshot[], focusPrompt: string) {
  if (focusPrompt.trim()) {
    return `${focusPrompt.trim()}：多论文综述`;
  }

  return `${papers[0]?.title ?? "多论文"} 等 ${papers.length} 篇综述`;
}

function getSnapshotChallenges(snapshot: ComparisonPaperSnapshot) {
  return snapshot.challenges.length > 0 ? snapshot.challenges : ["论文未明确说明"];
}

function getSnapshotNovelties(snapshot: ComparisonPaperSnapshot) {
  return snapshot.novelties.length > 0 ? snapshot.novelties : ["论文未明确说明"];
}

function buildFallbackComparisonReport(args: {
  focusPrompt: string;
  papers: ComparisonPaperSnapshot[];
}) {
  const selectedPapers = args.papers.slice(0, 10);

  return ComparisonReportSchema.parse({
    theme_overview: {
      field: args.focusPrompt || "这组论文共同围绕一个相近研究主题展开",
      importance: "这些论文可以帮助快速理解该研究方向的主要问题、方法路线与当前争议。",
      source_type: "inferred"
    },
    paper_cards: selectedPapers.map((paper) => ({
      paper_id: paper.paperId,
      title: paper.title,
      role: paper.roleHint || "该论文在这组文献中代表一条可比较的研究视角。",
      core_claim: paper.coreProblem,
      method_stance: paper.methodOverview,
      key_conclusion: paper.keyFindings[0] ?? "论文未明确说明",
      source_type: paper.sourceType
    })),
    consensus: [
      {
        title: "研究主题具有明显共同性",
        description: "这些论文围绕同一研究方向展开，但切入方法和强调重点存在差异。",
        source_type: "inferred",
        related_paper_ids: selectedPapers.map((paper) => paper.paperId)
      }
    ],
    disagreements: [
      {
        title: "方法与结论口径并不完全一致",
        description: "不同论文在问题拆解、方法路径和重点结论上存在差异，需要结合具体场景解释。",
        conflict_type: "method",
        source_type: "inferred",
        related_paper_ids: selectedPapers.slice(0, 2).map((paper) => paper.paperId)
      }
    ],
    connections: [
      {
        title: "论文之间存在互补关系",
        description: "有些论文更偏方法设计，有些更偏现象解释或应用验证，组合阅读价值更高。",
        relation_type: "complementary",
        source_type: "inferred",
        related_paper_ids: selectedPapers.map((paper) => paper.paperId)
      }
    ],
    method_landscape: [
      {
        route_name: "现有研究的主要方法路线",
        representative_paper_ids: selectedPapers.slice(0, Math.min(3, selectedPapers.length)).map((paper) => paper.paperId),
        strengths: "可以从不同角度解释同一问题，提高领域理解的完整性。",
        limits: "不同方法之间的评估口径和适用条件未必一致。",
        source_type: "inferred"
      }
    ],
    field_status: {
      maturity: "该方向已经形成一批可比较的研究成果，但尚未完全收敛成统一范式。",
      bottlenecks: "不同论文的结论口径、数据条件和方法假设尚未完全统一。",
      trajectory: "未来更值得关注跨方法验证、边界条件和研究空白的补足。",
      source_type: "inferred"
    },
    research_gaps: [
      {
        title: "统一评估口径仍不足",
        description: "现有论文之间还缺少更统一、更可横向对比的验证框架。",
        source_type: "inferred"
      },
      {
        title: "对边界条件的刻画不够充分",
        description: "不同研究结论在何种情境下成立，仍值得进一步细分和验证。",
        source_type: "inferred"
      }
    ],
    suggested_questions: [
      "这组论文最大的共识和最大分歧分别是什么？",
      "如果只读其中两篇，优先应该读哪两篇？",
      "这个方向下一步最值得补的研究空白是什么？"
    ]
  });
}

export async function generateComparisonReport(args: {
  focusPrompt: string;
  papers: ComparisonPaperSnapshot[];
}): Promise<ComparisonReport> {
  const title = buildComparisonTitle(args.papers, args.focusPrompt);

  return generateStructuredOutput({
    schemaName: "comparisonReport",
    schema: ComparisonReportSchema,
    prompt: buildComparisonReportPrompt({
      title,
      focusPrompt: args.focusPrompt,
      papers: args.papers
    }),
    normalize: normalizeComparisonReportPayload,
    fallback: () =>
      buildFallbackComparisonReport({
        focusPrompt: args.focusPrompt,
        papers: args.papers
      })
  });
}

function buildReportContext(comparison: ComparisonRecord) {
  const report = comparison.reportJson;

  if (!report) {
    return "综述结果尚未生成。";
  }

  return [
    `领域主题概览：${report.theme_overview.field}`,
    `重要性：${report.theme_overview.importance}`,
    `共识：${report.consensus.map((item) => item.title).join("；") || "论文未明确说明"}`,
    `分歧与矛盾：${report.disagreements.map((item) => item.title).join("；") || "论文未明确说明"}`,
    `联系：${report.connections.map((item) => item.title).join("；") || "论文未明确说明"}`,
    `方法谱系：${report.method_landscape.map((item) => item.route_name).join("；") || "论文未明确说明"}`,
    `现状判断：${report.field_status.maturity}`,
    `研究空白：${report.research_gaps.map((item) => item.title).join("；") || "论文未明确说明"}`
  ].join("\n");
}

function pickSupportingPapers(question: string, papers: ComparisonPaperSnapshot[]) {
  return [...papers]
    .map((paper) => ({
      paper,
      score: scoreTextMatch(
        question,
        [
          paper.title,
          paper.oneLiner,
          paper.coreProblem,
          paper.methodOverview,
          ...paper.keyFindings,
          ...getSnapshotChallenges(paper),
          ...getSnapshotNovelties(paper)
        ].join("\n")
      )
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.paper);
}

function buildFallbackComparisonChatAnswer(
  question: string,
  supportingPapers: ComparisonPaperSnapshot[],
  comparison: ComparisonRecord
) {
  return {
    answer:
      supportingPapers.length > 0
        ? `我先基于当前综述结果和最相关的论文给出一个保守回答。\n\n问题：${question}\n\n相关论文：\n${supportingPapers
            .map((paper, index) => `${index + 1}. ${paper.title}：${paper.oneLiner}`)
            .join("\n")}\n\n如果你愿意，我可以继续展开这些论文的共识、分歧或方法路线。`
        : "当前没有找到足够相关的论文摘要，暂时无法可靠回答这个问题。",
    supporting_paper_ids: supportingPapers.map((paper) => paper.paperId),
    supporting_sections: comparison.reportJson
      ? ["领域主题概览", "共识", "分歧与矛盾", "方法谱系"]
      : []
  };
}

export async function answerQuestionForComparison(comparisonId: string, question: string) {
  const comparison = await getComparison(comparisonId);

  if (!comparison) {
    throw new Error("多论文对比记录不存在。");
  }

  if (!comparison.reportJson) {
    throw new Error("综述结果尚未生成完成，暂时不能问答。");
  }

  const supportingPapers = pickSupportingPapers(question, comparison.paperSnapshots);
  const answer = await generateStructuredOutput({
    schemaName: "comparisonChatAnswer",
    schema: ComparisonChatAnswerSchema,
    prompt: buildComparisonChatPrompt({
      comparisonTitle: comparison.title,
      question,
      reportContext: buildReportContext(comparison),
      supportingPapers
    }),
    fallback: () => buildFallbackComparisonChatAnswer(question, supportingPapers, comparison)
  });

  const timestamp = nowIso();
  const messages: ComparisonChatMessage[] = [
    {
      id: createId("cmpmsg"),
      role: "user",
      content: question,
      createdAt: timestamp,
      supportingPaperIds: [],
      supportingSections: []
    },
    {
      id: createId("cmpmsg"),
      role: "assistant",
      content: answer.answer,
      createdAt: timestamp,
      supportingPaperIds: answer.supporting_paper_ids,
      supportingSections: answer.supporting_sections
    }
  ];

  const updated = await appendComparisonChatMessages(comparisonId, messages);
  return updated.chatMessages;
}
