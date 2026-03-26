"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

async function extractResponseMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `请求失败：${response.status}`;
  } catch {
    return `请求失败：${response.status}`;
  }
}

export function PaperSubmitPanel() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePdfSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("请先选择一个 PDF 文件。");
      return;
    }

    startTransition(() => {
      void (async () => {
        setError(null);
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/papers/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          setError(await extractResponseMessage(response));
          return;
        }

        const payload = (await response.json()) as { paperId: string };
        router.push(`/papers/${payload.paperId}`);
        router.refresh();
      })();
    });
  };

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      setError("请先输入网页链接。");
      return;
    }

    startTransition(() => {
      void (async () => {
        setError(null);
        const response = await fetch("/api/papers/from-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          setError(await extractResponseMessage(response));
          return;
        }

        const payload = (await response.json()) as { paperId: string };
        router.push(`/papers/${payload.paperId}`);
        router.refresh();
      })();
    });
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="eyebrow">双入口提交</div>
        <button
          className="button secondary button-compact"
          onClick={() => setIsCollapsed((value) => !value)}
          type="button"
        >
          {isCollapsed ? "展开" : "收起"}
        </button>
      </div>

      {isCollapsed ? (
        <p className="hint">
          这里可以上传 PDF 或粘贴网页链接发起新任务。需要时点击右上角“展开”即可继续提交。
        </p>
      ) : (
        <div className="form-grid">
        <form className="form-grid" onSubmit={handlePdfSubmit}>
          <div className="field">
            <label htmlFor="paper-upload">上传论文 PDF</label>
            <input
              id="paper-upload"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="actions">
            <button className="button" disabled={isPending} type="submit">
              {isPending ? "提交中..." : "上传并开始分析"}
            </button>
          </div>
        </form>

        <form className="form-grid" onSubmit={handleUrlSubmit}>
          <div className="field">
            <label htmlFor="paper-url">或者粘贴论文网页链接</label>
            <textarea
              id="paper-url"
              rows={4}
              placeholder="https://arxiv.org/abs/... 或博客论文解读页面"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <div className="actions">
            <button className="button secondary" disabled={isPending} type="submit">
              {isPending ? "创建任务中..." : "解析网页并开始分析"}
            </button>
          </div>
        </form>

        {error ? <p className="muted">{error}</p> : null}

        <p className="hint">
          当前版本会把任务放进本地异步队列，先完成正文抽取，再自动生成首屏摘要与深度分析。
        </p>
        </div>
      )}
    </section>
  );
}
