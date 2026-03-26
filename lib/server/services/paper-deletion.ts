import { unlink } from "node:fs/promises";
import { deletePaper } from "@/lib/server/paper-repository";
import { removePaperFromQueue } from "@/lib/server/services/processing-queue";

export async function deletePaperRecord(paperId: string) {
  removePaperFromQueue(paperId);
  const removedPaper = await deletePaper(paperId);

  if (!removedPaper) {
    return undefined;
  }

  if (removedPaper.filePath) {
    try {
      await unlink(removedPaper.filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
  }

  return removedPaper;
}
