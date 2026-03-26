import { appendChatMessages, getPaper } from "@/lib/server/paper-repository";
import { answerQuestionWithContext } from "@/lib/server/services/summarizer";
import { createId, nowIso, scoreTextMatch } from "@/lib/server/utils";
import type { ChatMessage, PaperChunk } from "@/lib/types";

function pickSupportingChunks(question: string, chunks: PaperChunk[]) {
  return [...chunks]
    .map((chunk) => ({
      chunk,
      score: scoreTextMatch(question, chunk.text)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.chunk);
}

export async function answerQuestionForPaper(paperId: string, question: string) {
  const paper = await getPaper(paperId);

  if (!paper) {
    throw new Error("论文不存在。");
  }

  if (!paper.content || paper.chunks.length === 0) {
    throw new Error("当前论文尚未完成正文抽取，暂时不能问答。");
  }

  const supportingChunks = pickSupportingChunks(question, paper.chunks);
  const answer = await answerQuestionWithContext({
    paper,
    question,
    supportingChunks
  });

  const timestamp = nowIso();
  const messages: ChatMessage[] = [
    {
      id: createId("msg"),
      role: "user",
      content: question,
      createdAt: timestamp,
      supportingChunkIds: []
    },
    {
      id: createId("msg"),
      role: "assistant",
      content: answer.answer,
      createdAt: timestamp,
      supportingChunkIds: answer.supporting_chunk_ids
    }
  ];

  const updated = await appendChatMessages(paperId, messages);
  return updated.chatMessages;
}
