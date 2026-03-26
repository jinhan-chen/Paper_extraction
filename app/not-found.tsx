import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel">
      <div className="eyebrow">未找到资源</div>
      <h1>这篇论文还不存在，或者任务记录已经丢失。</h1>
      <p className="muted">你可以回到工作台重新上传 PDF，或者重新提交网页链接。</p>
      <div className="actions">
        <Link className="button" href="/app">
          返回工作台
        </Link>
      </div>
    </section>
  );
}
