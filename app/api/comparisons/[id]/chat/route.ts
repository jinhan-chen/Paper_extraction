import { NextResponse } from "next/server";
import { getComparison } from "@/lib/server/comparison-repository";
import { answerQuestionForComparison } from "@/lib/server/services/comparison-service";

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

  return NextResponse.json({ messages: comparison.chatMessages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = (await request.json()) as { question?: string };

  if (!payload.question?.trim()) {
    return NextResponse.json({ error: "请输入问题。" }, { status: 400 });
  }

  try {
    const messages = await answerQuestionForComparison(id, payload.question.trim());
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "多论文对比问答失败。" },
      { status: 400 }
    );
  }
}
