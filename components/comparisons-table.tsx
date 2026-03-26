import Link from "next/link";
import { DeleteComparisonButton } from "@/components/delete-comparison-button";
import { getComparisonStatusLabel } from "@/lib/status-labels";
import type { ComparisonRecord } from "@/lib/types";

export function ComparisonsTable({ comparisons }: { comparisons: ComparisonRecord[] }) {
  return (
    <section className="table-card">
      <div className="page-title">
        <div>
          <h1 style={{ fontSize: "1.4rem" }}>多论文综述历史</h1>
          <p>这里保存你创建过的多论文对比任务，可以继续查看结果、追问和删除记录。</p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/comparisons/new">
            再建一份综述
          </Link>
        </div>
      </div>

      {comparisons.length === 0 ? (
        <p className="empty-state">还没有多论文综述记录。你可以先从工作台右侧入口或论文列表多选开始创建。</p>
      ) : (
        <div className="paper-list">
          {comparisons.map((comparison) => (
            <div className="paper-row" key={comparison.id}>
              <div>
                <h3>{comparison.title}</h3>
                <div className="badge-row">
                  <span className="pill">已选 {comparison.paperIds.length} 篇</span>
                  <span className="pill neutral">状态：{getComparisonStatusLabel(comparison.status)}</span>
                </div>
                <p className="muted">{comparison.focusPrompt}</p>
              </div>
              <div className="actions">
                <Link className="button secondary" href={`/comparisons/${comparison.id}`}>
                  查看综述
                </Link>
                <DeleteComparisonButton comparisonId={comparison.id} title={comparison.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
