import { processPaper } from "@/lib/server/services/paper-processing";

const queuedPaperIds = new Set<string>();
let isRunning = false;

async function drainQueue() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  while (queuedPaperIds.size > 0) {
    const nextPaperId = queuedPaperIds.values().next().value as string | undefined;

    if (!nextPaperId) {
      break;
    }

    queuedPaperIds.delete(nextPaperId);
    await processPaper(nextPaperId);
  }

  isRunning = false;
}

export function enqueuePaperProcessing(paperId: string) {
  queuedPaperIds.add(paperId);
  void drainQueue();
}

export function removePaperFromQueue(paperId: string) {
  queuedPaperIds.delete(paperId);
}
