import React from "react";
import type { AnnotatedText, PaperRecord } from "@/lib/types";

function SourceBadge({ sourceType }: { sourceType: AnnotatedText["source_type"] }) {
  const labelMap = {
    explicit: "原文明确",
    inferred: "模型推断",
    unknown: "未明确"
  };

  return <span className={`source-badge ${sourceType}`}>{labelMap[sourceType]}</span>;
}

function AnnotatedBlock({
  title,
  value
}: {
  title: string;
  value: AnnotatedText;
}) {
  return (
    <div className="note-card">
      <h3>{title}</h3>
      <p>{value.content}</p>
      <div className="badge-row">
        <SourceBadge sourceType={value.source_type} />
      </div>
    </div>
  );
}

export function DeepSummarySection({ paper }: { paper: PaperRecord }) {
  if (!paper.deepSummary) {
    return (
      <section className="summary-card collapsible-card">
        <details open>
          <summary className="collapsible-summary">
            <h2>深度分析</h2>
            <span className="collapsible-summary__state">
              <span className="when-open">收起</span>
              <span className="when-closed">展开</span>
            </span>
          </summary>
          <div className="collapsible-content">
            <p className="muted">深度分析尚未完成。完成后会在这里展示 Task、Challenge、Insight & Novelty、Potential Flaws 和 Motivation。</p>
          </div>
        </details>
      </section>
    );
  }

  const deep = paper.deepSummary;

  return (
    <section className="summary-card collapsible-card">
      <details open>
        <summary className="collapsible-summary">
          <h2>深度分析</h2>
          <span className="collapsible-summary__state">
            <span className="when-open">收起</span>
            <span className="when-closed">展开</span>
          </span>
        </summary>

        <div className="stack collapsible-content">
        <div className="note-card">
          <h3>Task</h3>
          <div className="summary-grid">
            <AnnotatedBlock title="问题定义" value={deep.task.problem} />
            <AnnotatedBlock title="输入" value={deep.task.input} />
            <AnnotatedBlock title="输出" value={deep.task.output} />
            <AnnotatedBlock title="目标" value={deep.task.objective} />
          </div>
          <h3 style={{ marginTop: "18px" }}>约束条件</h3>
          <ul>
            {deep.task.constraints.map((item, index) => (
              <li key={`${item.content}-${index}`}>
                {item.content} <SourceBadge sourceType={item.source_type} />
              </li>
            ))}
          </ul>
        </div>

        <div className="note-card">
          <h3>Challenge</h3>
          <div className="note-grid">
            {deep.challenge.map((item) => (
              <div className="note-card" key={`${item.area}-${item.title}`}>
                <h3>{item.title}</h3>
                <p>{item.explanation}</p>
                <div className="badge-row">
                  <span className="pill neutral">{item.area}</span>
                  <SourceBadge sourceType={item.source_type} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="note-card">
          <h3>Insight & Novelty</h3>
          <div className="stack">
            <div>
              <h3>Inspirations</h3>
              <div className="note-grid">
                {deep.insight_and_novelty.inspirations.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.explanation}</p>
                    <SourceBadge sourceType={item.source_type} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Insights</h3>
              <div className="note-grid">
                {deep.insight_and_novelty.insights.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.rationale}</p>
                    <p className="muted">针对问题：{item.problem_targeted}</p>
                    <div className="badge-row">
                      <span className="pill neutral">{item.layer}</span>
                      <SourceBadge sourceType={item.source_type} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Novelties</h3>
              <div className="note-grid">
                {deep.insight_and_novelty.novelties.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="badge-row">
                      <span className="pill neutral">{item.category}</span>
                      <SourceBadge sourceType={item.source_type} />
                    </div>
                    <ul>
                      <li>【创新点解决的问题】{item.reasoning_chain.problem}</li>
                      <li>【受哪个 insight 启发】{item.reasoning_chain.inspired_by_insight}</li>
                      <li>【设计了什么创新点】{item.reasoning_chain.design}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <details>
          <summary>Potential Flaws</summary>
          <div className="stack" style={{ marginTop: "16px" }}>
            <div className="note-card">
              <h3>场景局限</h3>
              <div className="note-grid">
                {deep.potential_flaws.scenario_limits.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.explanation}</p>
                    <p className="muted">延伸方向：{item.extension_direction}</p>
                    <SourceBadge sourceType={item.source_type} />
                  </div>
                ))}
              </div>
            </div>

            <div className="note-card">
              <h3>数据局限</h3>
              <div className="note-grid">
                {deep.potential_flaws.data_limits.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.explanation}</p>
                    <ul>
                      {item.problematic_properties.map((property) => (
                        <li key={property}>{property}</li>
                      ))}
                    </ul>
                    <SourceBadge sourceType={item.source_type} />
                  </div>
                ))}
              </div>
            </div>

            <div className="note-card">
              <h3>值得继续挖掘的问题</h3>
              <div className="note-grid">
                {deep.potential_flaws.research_opportunities.map((item) => (
                  <div className="note-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.why_it_matters}</p>
                    <p className="muted">下一步方向：{item.next_direction}</p>
                    <SourceBadge sourceType={item.source_type} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        <details>
          <summary>Motivation</summary>
          <div className="note-card" style={{ marginTop: "16px" }}>
            <h3>递进问句</h3>
            <ul>
              {deep.motivation.question_chain.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{deep.motivation.summary}</p>
          </div>
        </details>
        </div>
      </details>
    </section>
  );
}
