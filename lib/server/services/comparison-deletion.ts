import { deleteComparison } from "@/lib/server/comparison-repository";
import { removeComparisonFromQueue } from "@/lib/server/services/comparison-queue";

export async function deleteComparisonRecord(comparisonId: string) {
  removeComparisonFromQueue(comparisonId);
  return deleteComparison(comparisonId);
}
