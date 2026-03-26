import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { DeepSummarySection } from "@/components/deep-summary-section";
import { DeletePaperButton } from "@/components/delete-paper-button";
import { PaperStatusPoller } from "@/components/paper-status-poller";
import { QuickSummaryCard } from "@/components/quick-summary-card";
import { getPaper } from "@/lib/server/paper-repository";
import { getPaperStatusLabel, getSummaryStatusLabel } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = await getPaper(id);

  if (!paper) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="detail-head">
        <div>
          <h1>{paper.title}</h1>
          <p>
            这是统一的结果页组件：无论来源是 PDF 还是网页链接，都会在这里展示短摘要、深度分析以及针对当前论文的追问记录。
          </p>
        </div>
        <DeletePaperButton paperId={paper.id} redirectTo="/app" title={paper.title} />
      </div>

      <section className="status-card detail-status-card">
        <h2>任务状态</h2>
        <div className="meta-list detail-status-list">
          <div className="meta-item">
            <span>来源</span>
            <strong>{paper.sourceType === "pdf" ? "PDF 上传" : "网页链接"}</strong>
          </div>
          <div className="meta-item">
            <span>当前状态</span>
            <strong>{getPaperStatusLabel(paper.status)}</strong>
          </div>
          <div className="meta-item">
            <span>总结状态</span>
            <strong>{getSummaryStatusLabel(paper.summaryStatus)}</strong>
          </div>
          <div className="meta-item">
            <span>语言</span>
            <strong>{paper.language ?? "待识别"}</strong>
          </div>
        </div>
        {paper.errorMessage ? <p className="muted">失败原因：{paper.errorMessage}</p> : null}
        <PaperStatusPoller
          paperId={paper.id}
          initialSnapshot={{
            status: paper.status,
            summaryStatus: paper.summaryStatus,
            errorMessage: paper.errorMessage ?? null,
            hasQuickSummary: Boolean(paper.quickSummary),
            hasDeepSummary: Boolean(paper.deepSummary)
          }}
        />
      </section>

      <section className="detail-content-layout">
        <div className="stack">
          <QuickSummaryCard paper={paper} />
          <DeepSummarySection paper={paper} />
        </div>

        <ChatPanel paperId={paper.id} initialMessages={paper.chatMessages} />
      </section>
    </div>
  );
}
