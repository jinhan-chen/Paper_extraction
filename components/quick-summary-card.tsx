import React from "react";
import type { PaperRecord } from "@/lib/types";

export function QuickSummaryCard({ paper }: { paper: PaperRecord }) {
  return (
    <section className="summary-card collapsible-card">
      <details open>
        <summary className="collapsible-summary">
          <h2>首屏重点摘要</h2>
          <span className="collapsible-summary__state">
            <span className="when-open">收起</span>
            <span className="when-closed">展开</span>
          </span>
        </summary>

        <div className="collapsible-content">
          {!paper.quickSummary ? (
            <p className="muted">摘要还在生成中。任务完成后，这里会优先展示适合快速浏览的重点结论。</p>
          ) : (
            <div className="summary-stack">
              <div className="note-card">
                <h3>一句话总览</h3>
                <p>{paper.quickSummary.one_liner}</p>
              </div>
              <div className="note-card">
                <h3>核心问题</h3>
                <p>{paper.quickSummary.core_problem}</p>
              </div>
              <div className="note-card">
                <h3>方法概览</h3>
                <p>{paper.quickSummary.method_overview}</p>
              </div>
              <div className="note-card">
                <h3>适合谁看</h3>
                <p>{paper.quickSummary.audience}</p>
              </div>
              <div className="note-card">
                <h3>3 条核心发现</h3>
                <ul>
                  {paper.quickSummary.key_findings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="note-card">
                <h3>值不值得读</h3>
                <p>{paper.quickSummary.reading_worth}</p>
                <ul>
                  {paper.quickSummary.suggested_questions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
