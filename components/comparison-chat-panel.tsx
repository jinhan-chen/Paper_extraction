"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ComparisonChatMessage } from "@/lib/types";

async function extractResponseMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `请求失败：${response.status}`;
  } catch {
    return `请求失败：${response.status}`;
  }
}

export function ComparisonChatPanel({
  comparisonId,
  initialMessages
}: {
  comparisonId: string;
  initialMessages: ComparisonChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");
  const [optimisticQuestion, setOptimisticQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = useMemo(() => {
    const limit = optimisticQuestion ? 18 : 20;
    return messages.slice(-limit);
  }, [messages, optimisticQuestion]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [visibleMessages, optimisticQuestion, isPending]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    setOptimisticQuestion(trimmed);
    setQuestion("");

    startTransition(() => {
      void (async () => {
        setError(null);
        const response = await fetch(`/api/comparisons/${comparisonId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ question: trimmed })
        });

        if (!response.ok) {
          setError(await extractResponseMessage(response));
          setQuestion(trimmed);
          setOptimisticQuestion(null);
          return;
        }

        const payload = (await response.json()) as { messages: ComparisonChatMessage[] };
        setMessages(payload.messages);
        setOptimisticQuestion(null);
      })();
    });
  };

  return (
    <section className="chat-card collapsible-card">
      <details open>
        <summary className="collapsible-summary">
          <h2>对比问答</h2>
          <span className="collapsible-summary__state">
            <span className="when-open">收起</span>
            <span className="when-closed">展开</span>
          </span>
        </summary>

        <div className="collapsible-content">
          <div className="chat-card__head">
            <span className="muted">基于综述结果 + 已选论文继续追问</span>
            <span className="muted">最多展示最近 20 条</span>
          </div>

          <div className="chat-thread" ref={threadRef}>
            {visibleMessages.length === 0 && !optimisticQuestion ? (
              <p className="muted">这里会保存围绕当前多论文综述的追问记录，例如“这组论文最大的分歧到底是什么？”</p>
            ) : (
              visibleMessages.map((message) => (
                <div className={`chat-bubble ${message.role}`} key={message.id}>
                  <strong>{message.role === "assistant" ? "系统回答" : "你"}</strong>
                  <p>{message.content}</p>
                </div>
              ))
            )}

            {optimisticQuestion ? (
              <>
                <div className="chat-bubble user">
                  <strong>你</strong>
                  <p>{optimisticQuestion}</p>
                </div>
                <div className="chat-bubble assistant loading">
                  <strong>系统回答</strong>
                  <p>正在综合这组论文的观点，请稍等...</p>
                </div>
              </>
            ) : null}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              rows={4}
              placeholder="例如：这组论文最大的矛盾是什么？"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <div className="actions">
              <button className="button" disabled={isPending} type="submit">
                {isPending ? "思考中..." : "发送问题"}
              </button>
            </div>
          </form>

          {error ? <p className="muted">{error}</p> : null}
        </div>
      </details>
    </section>
  );
}
