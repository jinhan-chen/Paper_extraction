import { NextResponse } from "next/server";
import { getPaper } from "@/lib/server/paper-repository";
import { answerQuestionForPaper } from "@/lib/server/services/chat-service";

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

  return NextResponse.json({ messages: paper.chatMessages });
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
    const messages = await answerQuestionForPaper(id, payload.question.trim());
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "问答失败。"
      },
      { status: 400 }
    );
  }
}
