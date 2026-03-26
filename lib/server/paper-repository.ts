import { mutateDatabase, readDatabase } from "@/lib/server/storage/local-db";
import { nowIso } from "@/lib/server/utils";
import type { ChatMessage, PaperRecord } from "@/lib/types";

export async function listPapers() {
  const database = await readDatabase();
  return database.papers.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getPaper(id: string) {
  const database = await readDatabase();
  return database.papers.find((paper) => paper.id === id);
}

export async function createPaper(record: PaperRecord) {
  return mutateDatabase((database) => {
    database.papers.unshift(record);
    return record;
  });
}

export async function updatePaper(
  id: string,
  updater: (paper: PaperRecord) => PaperRecord | Promise<PaperRecord>
) {
  return mutateDatabase(async (database) => {
    const index = database.papers.findIndex((paper) => paper.id === id);

    if (index === -1) {
      throw new Error(`Paper ${id} was not found.`);
    }

    const nextPaper = await updater(database.papers[index]);
    nextPaper.updatedAt = nowIso();
    database.papers[index] = nextPaper;
    return nextPaper;
  });
}

export async function appendChatMessages(id: string, messages: ChatMessage[]) {
  return updatePaper(id, (paper) => ({
    ...paper,
    chatMessages: [...paper.chatMessages, ...messages]
  }));
}

export async function deletePaper(id: string) {
  return mutateDatabase((database) => {
    const index = database.papers.findIndex((paper) => paper.id === id);

    if (index === -1) {
      return undefined;
    }

    const [removedPaper] = database.papers.splice(index, 1);
    return removedPaper;
  });
}
