import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="panel">
        <div className="eyebrow">自动总结主提示词已接入双层输出</div>
        <h1>把论文读懂这件事，做得更像一位研究搭档。</h1>
        <p>
          上传 PDF 或粘贴网页链接后，系统会先给出首屏重点摘要，再生成完整深度解读，
          把问题定义、方法洞察、创新链路和潜在局限拆成结构化结果，方便你快速浏览和继续追问。
        </p>
        <div className="actions">
          <Link className="button" href="/app">
            打开工作台
          </Link>
          <Link className="button secondary" href="#features">
            查看产品结构
          </Link>
        </div>
        <div className="hero-grid">
          <div className="metric">
            <strong>双层输出</strong>
            <span>首屏速读 + 深度分析</span>
          </div>
          <div className="metric">
            <strong>统一 JSON</strong>
            <span>PDF 与网页共用同一渲染层</span>
          </div>
          <div className="metric">
            <strong>异步处理</strong>
            <span>上传后排队，状态清晰可见</span>
          </div>
          <div className="metric">
            <strong>论文内问答</strong>
            <span>基于同一篇论文继续追问</span>
          </div>
        </div>
      </div>

      <div className="panel" id="features">
        <h2>当前实现包含</h2>
        <div className="note-grid">
          <div className="note-card">
            <h3>Prompt 三层结构</h3>
            <p>区分系统角色、首屏摘要和深度分析，减少线上输出漂移。</p>
          </div>
          <div className="note-card">
            <h3>可校验 Schema</h3>
            <p>所有自动总结必须通过 Zod 校验，失败后会自动重试一次。</p>
          </div>
          <div className="note-card">
            <h3>长文分块归并</h3>
            <p>长论文先分块压缩，再做全局总结，避免一次性塞满上下文。</p>
          </div>
          <div className="note-card">
            <h3>OpenRouter PDF 解析</h3>
            <p>文本提取不足时会切换到 OpenRouter 的 PDF parser / OCR 能力，不需要再额外配置第二套 key。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
