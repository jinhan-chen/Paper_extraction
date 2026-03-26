"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DeletePaperButton } from "@/components/delete-paper-button";
import { getPaperStatusLabel, getSummaryStatusLabel } from "@/lib/status-labels";
import type { PaperRecord } from "@/lib/types";

const MAX_SELECTION = 10;

function canComparePaper(paper: PaperRecord) {
  return paper.status === "ready" && paper.summaryStatus === "ready";
}

export function PapersTable({ papers }: { papers: PaperRecord[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const selectedReadyCount = selectedIds.length;
  const readyPaperCount = useMemo(() => papers.filter(canComparePaper).length, [papers]);

  const togglePaper = (paper: PaperRecord) => {
    if (!canComparePaper(paper)) {
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(paper.id)) {
        setSelectionError(null);
        return current.filter((id) => id !== paper.id);
      }

      if (current.length >= MAX_SELECTION) {
        setSelectionError(`一次最多只能选择 ${MAX_SELECTION} 篇已完成总结的论文。`);
        return current;
      }

      setSelectionError(null);
      return [...current, paper.id];
    });
  };

  const handleCompareSelected = () => {
    if (selectedReadyCount < 2) {
      setSelectionError("至少选择 2 篇已完成总结的论文，才能生成多论文综述。");
      return;
    }

    const search = new URLSearchParams({
      paperIds: selectedIds.join(",")
    });
    router.push(`/comparisons/new?${search.toString()}`);
  };

  return (
    <section className="table-card">
      <div className="page-title">
        <div>
          <h1 style={{ fontSize: "1.4rem" }}>最近分析</h1>
          <p>这里展示所有提交过的论文任务；已完成总结的论文可以直接多选并发起多论文对比。</p>
        </div>

        <div className="actions">
          <Link className="button secondary" href="/comparisons/new">
            新建多论文对比
          </Link>
          <button
            className="button"
            disabled={selectedReadyCount < 2}
            onClick={handleCompareSelected}
            type="button"
          >
            对比已选论文
          </button>
        </div>
      </div>

      {papers.length === 0 ? (
        <p className="empty-state">还没有任务。可以先上传一篇 PDF，或者粘贴一个论文网页链接试试。</p>
      ) : (
        <>
          <div className="comparison-toolbar">
            <span className="muted">可用于多论文对比：{readyPaperCount} 篇</span>
            <div className="badge-row">
              <span className="pill">已选择 {selectedReadyCount} / {MAX_SELECTION}</span>
              {selectedReadyCount > 0 ? (
                <button
                  className="button secondary button-compact"
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectionError(null);
                  }}
                  type="button"
                >
                  清空选择
                </button>
              ) : null}
            </div>
          </div>

          <div className="paper-list">
            {papers.map((paper) => {
              const available = canComparePaper(paper);
              const checked = selectedIds.includes(paper.id);

              return (
                <div className="paper-row" key={paper.id}>
                  <div className="paper-row__main">
                    <label className={`select-chip ${available ? "" : "disabled"}`}>
                      <input
                        checked={checked}
                        disabled={!available}
                        onChange={() => togglePaper(paper)}
                        type="checkbox"
                      />
                      <span>{checked ? "已选中" : available ? "加入对比" : "暂不可选"}</span>
                    </label>

                    <div>
                      <h3>{paper.title}</h3>
                      <div className="badge-row">
                        <span className="pill">{paper.sourceType === "pdf" ? "PDF 文档" : "网页链接"}</span>
                        <span className="pill neutral">任务状态：{getPaperStatusLabel(paper.status)}</span>
                        <span className="pill neutral">总结状态：{getSummaryStatusLabel(paper.summaryStatus)}</span>
                      </div>
                      <p className="muted">
                        {paper.quickSummary?.one_liner ?? "处理中后会在这里出现一段首屏摘要。"}
                      </p>
                    </div>
                  </div>

                  <div className="actions">
                    <Link className="button secondary" href={`/papers/${paper.id}`}>
                      查看详情
                    </Link>
                    <DeletePaperButton paperId={paper.id} title={paper.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectionError ? <p className="muted">{selectionError}</p> : null}
    </section>
  );
}
