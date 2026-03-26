import { notFound } from "next/navigation";
import { ComparisonChatPanel } from "@/components/comparison-chat-panel";
import { ComparisonReport } from "@/components/comparison-report";
import { ComparisonStatusPoller } from "@/components/comparison-status-poller";
import { DeleteComparisonButton } from "@/components/delete-comparison-button";
import { getComparison } from "@/lib/server/comparison-repository";
import { getComparisonStatusLabel } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function ComparisonDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comparison = await getComparison(id);

  if (!comparison) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="detail-head">
        <div>
          <h1>{comparison.title}</h1>
          <p>{comparison.focusPrompt}</p>
        </div>
        <DeleteComparisonButton comparisonId={comparison.id} redirectTo="/app" title={comparison.title} />
      </div>

      <section className="status-card detail-status-card">
        <h2>多论文任务状态</h2>
        <div className="meta-list detail-status-list">
          <div className="meta-item">
            <span>已选论文</span>
            <strong>{comparison.paperIds.length} 篇</strong>
          </div>
          <div className="meta-item">
            <span>当前状态</span>
            <strong>{getComparisonStatusLabel(comparison.status)}</strong>
          </div>
          <div className="meta-item">
            <span>综述标题</span>
            <strong>{comparison.title}</strong>
          </div>
          <div className="meta-item">
            <span>创建时间</span>
            <strong>{new Date(comparison.createdAt).toLocaleString("zh-CN")}</strong>
          </div>
        </div>
        {comparison.errorMessage ? <p className="muted">失败原因：{comparison.errorMessage}</p> : null}
        <ComparisonStatusPoller
          comparisonId={comparison.id}
          initialSnapshot={{
            status: comparison.status,
            errorMessage: comparison.errorMessage ?? null,
            hasReport: Boolean(comparison.reportJson)
          }}
        />
      </section>

      <section className="detail-content-layout">
        <ComparisonReport comparison={comparison} />
        <ComparisonChatPanel comparisonId={comparison.id} initialMessages={comparison.chatMessages} />
      </section>
    </div>
  );
}
