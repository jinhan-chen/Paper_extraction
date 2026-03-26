import { NextResponse } from "next/server";
import { getPaper } from "@/lib/server/paper-repository";
import { deletePaperRecord } from "@/lib/server/services/paper-deletion";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paper = await getPaper(id);

  if (!paper) {
    return NextResponse.json({ error: "论文不存在。" }, { status: 404 });
  }

  return NextResponse.json({
    id: paper.id,
    title: paper.title,
    status: paper.status,
    summaryStatus: paper.summaryStatus,
    quickSummary: paper.quickSummary ?? null,
    deepSummary: paper.deepSummary ?? null,
    sourceType: paper.sourceType,
    language: paper.language ?? null,
    errorMessage: paper.errorMessage ?? null
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removedPaper = await deletePaperRecord(id);

  if (!removedPaper) {
    return NextResponse.json({ error: "论文不存在。" }, { status: 404 });
  }

  return NextResponse.json({ success: true, paperId: id });
}
