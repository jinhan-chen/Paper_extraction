"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaperStatus, SummaryStatus } from "@/lib/types";

type StatusSnapshot = {
  status: PaperStatus;
  summaryStatus: SummaryStatus;
  errorMessage?: string | null;
  hasQuickSummary: boolean;
  hasDeepSummary: boolean;
};

function isProcessing(snapshot: StatusSnapshot) {
  return (
    snapshot.status !== "ready" &&
    snapshot.status !== "failed" &&
    snapshot.summaryStatus !== "ready" &&
    snapshot.summaryStatus !== "failed"
  );
}

export function PaperStatusPoller({
  paperId,
  initialSnapshot
}: {
  paperId: string;
  initialSnapshot: StatusSnapshot;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (!isProcessing(snapshot)) {
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      if (cancelled || document.visibilityState === "hidden") {
        return;
      }

      const currentSnapshot = snapshotRef.current;
      const response = await fetch(`/api/papers/${paperId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        status: PaperStatus;
        summaryStatus: SummaryStatus;
        errorMessage?: string | null;
        quickSummary?: unknown;
        deepSummary?: unknown;
      };

      const nextSnapshot: StatusSnapshot = {
        status: payload.status,
        summaryStatus: payload.summaryStatus,
        errorMessage: payload.errorMessage ?? null,
        hasQuickSummary: Boolean(payload.quickSummary),
        hasDeepSummary: Boolean(payload.deepSummary)
      };

      const hasChanged =
        nextSnapshot.status !== currentSnapshot.status ||
        nextSnapshot.summaryStatus !== currentSnapshot.summaryStatus ||
        nextSnapshot.errorMessage !== currentSnapshot.errorMessage ||
        nextSnapshot.hasQuickSummary !== currentSnapshot.hasQuickSummary ||
        nextSnapshot.hasDeepSummary !== currentSnapshot.hasDeepSummary;

      setSnapshot(nextSnapshot);
      setLastCheckedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));

      if (hasChanged) {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    void pollStatus();
    const timer = window.setInterval(() => {
      void pollStatus();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [paperId, router, snapshot, startTransition]);

  return (
    <div className="poller-card" aria-live="polite">
      {isProcessing(snapshot) ? (
        <>
          <strong>{isRefreshing ? "正在刷新结果..." : "正在自动轮询任务状态"}</strong>
          <p>每 3 秒检查一次处理进度；一旦摘要生成完成，页面会自动刷新。</p>
          {lastCheckedAt ? <span>最近检查：{lastCheckedAt}</span> : null}
        </>
      ) : (
        <>
          <strong>自动轮询已停止</strong>
          <p>
            {snapshot.status === "ready" || snapshot.summaryStatus === "ready"
              ? "摘要已经完成，页面已停留在最新结果。"
              : "任务已结束或失败，不再继续轮询。"}
          </p>
        </>
      )}
    </div>
  );
}
