import { NextResponse } from "next/server";
import { getComparison } from "@/lib/server/comparison-repository";
import { deleteComparisonRecord } from "@/lib/server/services/comparison-deletion";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comparison = await getComparison(id);

  if (!comparison) {
    return NextResponse.json({ error: "多论文对比记录不存在。" }, { status: 404 });
  }

  return NextResponse.json(comparison);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await deleteComparisonRecord(id);

  if (!removed) {
    return NextResponse.json({ error: "多论文对比记录不存在。" }, { status: 404 });
  }

  return NextResponse.json({ success: true, comparisonId: id });
}
