"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import type { PaperRecord } from "@/lib/types";

const MAX_SELECTION = 10;

type SelectablePaper = Pick<PaperRecord, "id" | "title" | "sourceType" | "quickSummary" | "status" | "summaryStatus">;

async function extractResponseMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `请求失败：${response.status}`;
  } catch {
    return `请求失败：${response.status}`;
  }
}

export function ComparisonCreateForm({ papers }: { papers: SelectablePaper[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const readyPapers = useMemo(
    () => papers.filter((paper) => paper.status === "ready" && paper.summaryStatus === "ready"),
    [papers]
  );
  const readyPaperIdSet = useMemo(() => new Set(readyPapers.map((paper) => paper.id)), [readyPapers]);
  const preselectedIds = (searchParams.get("paperIds") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && readyPaperIdSet.has(item))
    .slice(0, MAX_SELECTION);

  const [selectedIds, setSelectedIds] = useState<string[]>(preselectedIds);
  const [focusPrompt, setFocusPrompt] = useState("请梳理这组论文的研究现状、核心分歧、方法路线和研究空白。");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const togglePaper = (paperId: string) => {
    setSelectedIds((current) => {
      if (current.includes(paperId)) {
        return current.filter((id) => id !== paperId);
      }

      if (current.length >= MAX_SELECTION) {
        setError(`一次最多只能选择 ${MAX_SELECTION} 篇论文。`);
        return current;
      }

      setError(null);
      return [...current, paperId];
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedIds.length < 2) {
      setError("至少选择 2 篇论文才能生成多论文综述。");
      return;
    }

    startTransition(() => {
      void (async () => {
        setError(null);
        const response = await fetch("/api/comparisons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paperIds: selectedIds,
            focusPrompt
          })
        });

        if (!response.ok) {
          setError(await extractResponseMessage(response));
          return;
        }

        const payload = (await response.json()) as { comparisonId: string };
        router.push(`/comparisons/${payload.comparisonId}` as Route);
      })();
    });
  };

  return (
    <section className="panel">
      <div className="page-title">
        <div>
          <h1 style={{ fontSize: "1.6rem" }}>创建多论文综述</h1>
          <p>从已经完成总结的论文中选择 2 到 10 篇，输入一个综述主题或关注角度，系统会异步生成一份可回访的综述结果。</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="focus-prompt">综述主题 / 关注角度</label>
          <textarea
            id="focus-prompt"
            rows={4}
            value={focusPrompt}
            onChange={(event) => setFocusPrompt(event.target.value)}
          />
        </div>

        <div className="comparison-selection-head">
          <strong>可选论文</strong>
          <span className="muted">已选择 {selectedIds.length} / {MAX_SELECTION}</span>
        </div>

        {readyPapers.length === 0 ? (
          <p className="empty-state">当前还没有可用于多论文对比的论文。请先完成至少 2 篇论文的摘要生成。</p>
        ) : (
          <div className="comparison-list">
            {readyPapers.map((paper) => (
              <label className="comparison-option" key={paper.id}>
                <input
                  checked={selectedIds.includes(paper.id)}
                  onChange={() => togglePaper(paper.id)}
                  type="checkbox"
                />
                <div>
                  <strong>{paper.title}</strong>
                  <p className="muted">{paper.quickSummary?.one_liner ?? "这篇论文已有可用摘要。"}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="actions">
          <button className="button" disabled={isPending} type="submit">
            {isPending ? "创建中..." : "生成多论文综述"}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setSelectedIds([]);
              setError(null);
            }}
            type="button"
          >
            清空选择
          </button>
        </div>

        {error ? <p className="muted">{error}</p> : null}
      </form>
    </section>
  );
}
