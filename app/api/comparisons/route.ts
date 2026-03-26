import { NextResponse } from "next/server";
import { listComparisons } from "@/lib/server/comparison-repository";
import { createComparisonTask } from "@/lib/server/services/comparison-processing";
import { enqueueComparisonProcessing } from "@/lib/server/services/comparison-queue";

export const dynamic = "force-dynamic";

export async function GET() {
  const comparisons = await listComparisons();
  return NextResponse.json({ comparisons });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    paperIds?: string[];
    focusPrompt?: string;
  };

  try {
    const comparison = await createComparisonTask({
      paperIds: payload.paperIds ?? [],
      focusPrompt: payload.focusPrompt ?? ""
    });
    enqueueComparisonProcessing(comparison.id);
    return NextResponse.json({ comparisonId: comparison.id, status: comparison.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建多论文对比失败。" },
      { status: 400 }
    );
  }
}
