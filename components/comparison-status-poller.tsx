"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComparisonStatus } from "@/lib/types";

type StatusSnapshot = {
  status: ComparisonStatus;
  errorMessage?: string | null;
  hasReport: boolean;
};

function isProcessing(snapshot: StatusSnapshot) {
  return snapshot.status !== "ready" && snapshot.status !== "failed";
}

export function ComparisonStatusPoller({
  comparisonId,
  initialSnapshot
}: {
  comparisonId: string;
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
      const response = await fetch(`/api/comparisons/${comparisonId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        status: ComparisonStatus;
        errorMessage?: string | null;
        reportJson?: unknown;
      };

      const nextSnapshot: StatusSnapshot = {
        status: payload.status,
        errorMessage: payload.errorMessage ?? null,
        hasReport: Boolean(payload.reportJson)
      };

      const hasChanged =
        nextSnapshot.status !== currentSnapshot.status ||
        nextSnapshot.errorMessage !== currentSnapshot.errorMessage ||
        nextSnapshot.hasReport !== currentSnapshot.hasReport;

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
  }, [comparisonId, router, snapshot, startTransition]);

  return (
    <div className="poller-card" aria-live="polite">
      {isProcessing(snapshot) ? (
        <>
          <strong>{isRefreshing ? "正在刷新综述结果..." : "正在自动轮询任务状态"}</strong>
          <p>每 3 秒检查一次多论文综述进度；一旦生成完成，页面会自动刷新。</p>
          {lastCheckedAt ? <span>最近检查：{lastCheckedAt}</span> : null}
        </>
      ) : (
        <>
          <strong>自动轮询已停止</strong>
          <p>{snapshot.status === "ready" ? "综述结果已经完成，页面已停留在最新结果。" : "任务已结束或失败，不再继续轮询。"}</p>
        </>
      )}
    </div>
  );
}
