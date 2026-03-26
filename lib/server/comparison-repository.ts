import { mutateDatabase, readDatabase } from "@/lib/server/storage/local-db";
import { nowIso } from "@/lib/server/utils";
import type { ComparisonChatMessage, ComparisonRecord } from "@/lib/types";

export async function listComparisons() {
  const database = await readDatabase();
  return database.comparisons.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getComparison(id: string) {
  const database = await readDatabase();
  return database.comparisons.find((comparison) => comparison.id === id);
}

export async function createComparison(record: ComparisonRecord) {
  return mutateDatabase((database) => {
    database.comparisons.unshift(record);
    return record;
  });
}

export async function updateComparison(
  id: string,
  updater: (comparison: ComparisonRecord) => ComparisonRecord | Promise<ComparisonRecord>
) {
  return mutateDatabase(async (database) => {
    const index = database.comparisons.findIndex((comparison) => comparison.id === id);

    if (index === -1) {
      throw new Error(`Comparison ${id} was not found.`);
    }

    const nextComparison = await updater(database.comparisons[index]);
    nextComparison.updatedAt = nowIso();
    database.comparisons[index] = nextComparison;
    return nextComparison;
  });
}

export async function appendComparisonChatMessages(id: string, messages: ComparisonChatMessage[]) {
  return updateComparison(id, (comparison) => ({
    ...comparison,
    chatMessages: [...comparison.chatMessages, ...messages]
  }));
}

export async function deleteComparison(id: string) {
  return mutateDatabase((database) => {
    const index = database.comparisons.findIndex((comparison) => comparison.id === id);

    if (index === -1) {
      return undefined;
    }

    const [removedComparison] = database.comparisons.splice(index, 1);
    return removedComparison;
  });
}
