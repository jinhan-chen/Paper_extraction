import type { ComparisonRecord } from "@/lib/types";

export function ComparisonReport({ comparison }: { comparison: ComparisonRecord }) {
  if (!comparison.reportJson) {
    return (
      <section className="summary-card collapsible-card">
        <details open>
          <summary className="collapsible-summary">
            <h2>综述结果</h2>
            <span className="collapsible-summary__state">
              <span className="when-open">收起</span>
              <span className="when-closed">展开</span>
            </span>
          </summary>
          <div className="collapsible-content">
            <p className="muted">综述仍在生成中。完成后，这里会展示领域主题、共识、分歧、联系、现状和研究空白。</p>
          </div>
        </details>
      </section>
    );
  }

  const report = comparison.reportJson;

  return (
    <section className="summary-card collapsible-card">
      <details open>
        <summary className="collapsible-summary">
          <h2>综述结果</h2>
          <span className="collapsible-summary__state">
            <span className="when-open">收起</span>
            <span className="when-closed">展开</span>
          </span>
        </summary>

        <div className="stack collapsible-content">
          <div className="note-card">
            <h3>领域主题概览</h3>
            <p>{report.theme_overview.field}</p>
            <p>{report.theme_overview.importance}</p>
          </div>

          <div className="note-card">
            <h3>选中文献卡片</h3>
            <div className="note-grid">
              {report.paper_cards.map((paper) => (
                <div className="note-card" key={paper.paper_id}>
                  <h3>{paper.title}</h3>
                  <p>角色：{paper.role}</p>
                  <p>核心主张：{paper.core_claim}</p>
                  <p>方法立场：{paper.method_stance}</p>
                  <p>关键结论：{paper.key_conclusion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>共识</h3>
            <div className="note-grid">
              {report.consensus.map((item) => (
                <div className="note-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>分歧与矛盾</h3>
            <div className="note-grid">
              {report.disagreements.map((item) => (
                <div className="note-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="badge-row">
                    <span className="pill neutral">{item.conflict_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>联系</h3>
            <div className="note-grid">
              {report.connections.map((item) => (
                <div className="note-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="badge-row">
                    <span className="pill neutral">{item.relation_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>方法谱系</h3>
            <div className="note-grid">
              {report.method_landscape.map((item) => (
                <div className="note-card" key={item.route_name}>
                  <h3>{item.route_name}</h3>
                  <p>优势：{item.strengths}</p>
                  <p>局限：{item.limits}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>现状判断</h3>
            <p>成熟度：{report.field_status.maturity}</p>
            <p>瓶颈：{report.field_status.bottlenecks}</p>
            <p>趋势：{report.field_status.trajectory}</p>
          </div>

          <div className="note-card">
            <h3>研究空白</h3>
            <div className="note-grid">
              {report.research_gaps.map((item) => (
                <div className="note-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="note-card">
            <h3>值得追问的问题</h3>
            <ul>
              {report.suggested_questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}
