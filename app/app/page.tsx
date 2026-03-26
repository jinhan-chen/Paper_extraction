import Link from "next/link";
import { PaperSubmitPanel } from "@/components/paper-submit-panel";
import { ComparisonsTable } from "@/components/comparisons-table";
import { PapersTable } from "@/components/papers-table";
import { listComparisons } from "@/lib/server/comparison-repository";
import { listPapers } from "@/lib/server/paper-repository";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const papers = await listPapers();
  const comparisons = await listComparisons();

  return (
    <div className="stack">
      <div className="page-title">
        <div>
          <h1>工作台</h1>
          <p>
            从这里发起 PDF 上传或网页解析任务，也可以把多篇已完成论文组合成一份综述式对比结果，并继续围绕该领域追问。
          </p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/comparisons/new">
            新建多论文对比
          </Link>
        </div>
      </div>

      <section className="workspace-grid">
        <PaperSubmitPanel />
        <PapersTable papers={papers} />
      </section>

      <ComparisonsTable comparisons={comparisons} />
    </div>
  );
}
