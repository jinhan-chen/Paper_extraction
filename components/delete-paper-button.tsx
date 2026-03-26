"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeletePaperButton({
  paperId,
  title,
  redirectTo
}: {
  paperId: string;
  title: string;
  redirectTo?: Route;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(`确认删除《${title}》这条分析记录吗？删除后无法恢复。`);

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        setError(null);
        const response = await fetch(`/api/papers/${paperId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "删除失败。");
          return;
        }

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      })();
    });
  };

  return (
    <div className="delete-action">
      <button className="button danger" disabled={isPending} onClick={handleDelete} type="button">
        {isPending ? "删除中..." : "删除记录"}
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </div>
  );
}
