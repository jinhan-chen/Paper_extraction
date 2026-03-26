import { NextResponse } from "next/server";
import { createPaperFromUrl } from "@/lib/server/services/paper-processing";
import { enqueuePaperProcessing } from "@/lib/server/services/processing-queue";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json()) as { url?: string };

  if (!payload.url?.trim()) {
    return NextResponse.json({ error: "请提供有效的网页链接。" }, { status: 400 });
  }

  try {
    new URL(payload.url);
  } catch {
    return NextResponse.json({ error: "链接格式不正确。" }, { status: 400 });
  }

  const paper = await createPaperFromUrl(payload.url);
  enqueuePaperProcessing(paper.id);

  return NextResponse.json({ paperId: paper.id, status: paper.status }, { status: 202 });
}
