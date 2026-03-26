import { processComparison } from "@/lib/server/services/comparison-processing";

const queuedComparisonIds = new Set<string>();
let isRunning = false;

async function drainQueue() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  while (queuedComparisonIds.size > 0) {
    const nextComparisonId = queuedComparisonIds.values().next().value as string | undefined;

    if (!nextComparisonId) {
      break;
    }

    queuedComparisonIds.delete(nextComparisonId);
    await processComparison(nextComparisonId);
  }

  isRunning = false;
}

export function enqueueComparisonProcessing(comparisonId: string) {
  queuedComparisonIds.add(comparisonId);
  void drainQueue();
}

export function removeComparisonFromQueue(comparisonId: string) {
  queuedComparisonIds.delete(comparisonId);
}
