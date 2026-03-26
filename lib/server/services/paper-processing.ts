import { basename } from "node:path";
import { DEFAULT_USER_ID } from "@/lib/server/config";
import { extractPdfContent } from "@/lib/server/parsers/pdf";
import { extractUrlContent } from "@/lib/server/parsers/url";
import { createPaper, getPaper, updatePaper } from "@/lib/server/paper-repository";
import { summarizePaperContent } from "@/lib/server/services/summarizer";
import { saveUploadedPdf } from "@/lib/server/storage/uploads";
import { createId, detectLanguage, inferTitleFromUrl, normalizeWhitespace, nowIso } from "@/lib/server/utils";
import type { PaperRecord } from "@/lib/types";

async function safeUpdatePaper(
  paperId: string,
  updater: (paper: PaperRecord) => PaperRecord | Promise<PaperRecord>
) {
  try {
    return await updatePaper(paperId, updater);
  } catch (error) {
    if (error instanceof Error && error.message.includes("was not found")) {
      return undefined;
    }

    throw error;
  }
}

export async function createPaperFromUpload(file: File) {
  const saved = await saveUploadedPdf(file);
  const timestamp = nowIso();
  const paper: PaperRecord = {
    id: createId("paper"),
    userId: DEFAULT_USER_ID,
    title: file.name.replace(/\.pdf$/i, "") || "未命名论文",
    sourceType: "pdf",
    fileName: saved.fileName,
    filePath: saved.filePath,
    status: "queued",
    summaryStatus: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {
      uploadedBytes: file.size,
      originalFileName: file.name
    },
    chunks: [],
    chatMessages: []
  };

  await createPaper(paper);
  return paper;
}

export async function createPaperFromUrl(url: string) {
  const timestamp = nowIso();
  const paper: PaperRecord = {
    id: createId("paper"),
    userId: DEFAULT_USER_ID,
    title: inferTitleFromUrl(url),
    sourceType: "url",
    sourceUrl: url,
    status: "queued",
    summaryStatus: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {
      requestedUrl: url
    },
    chunks: [],
    chatMessages: []
  };

  await createPaper(paper);
  return paper;
}

export async function processPaper(paperId: string) {
  const existing = await getPaper(paperId);

  if (!existing) {
    return;
  }

  try {
    const extractingPaper = await safeUpdatePaper(paperId, (paper) => ({
      ...paper,
      status: "extracting",
      summaryStatus: "generating",
      errorMessage: undefined
    }));

    if (!extractingPaper) {
      return;
    }

    const paper = await getPaper(paperId);

    if (!paper) {
      throw new Error("论文记录不存在。");
    }

    const extraction =
      paper.sourceType === "pdf"
        ? await extractPdfContent(paper.filePath ?? "")
        : await extractUrlContent(paper.sourceUrl ?? "");

    const normalizedText = normalizeWhitespace(extraction.fullText);
    const title =
      extraction.title?.trim() ||
      paper.title ||
      paper.fileName?.replace(/\.pdf$/i, "") ||
      (paper.sourceUrl ? inferTitleFromUrl(paper.sourceUrl) : basename(paper.filePath ?? "")) ||
      "未命名论文";

    const summarizingPaper = await safeUpdatePaper(paperId, (currentPaper) => ({
      ...currentPaper,
      title,
      language: detectLanguage(normalizedText),
      status: "summarizing",
      summaryStatus: "generating",
      metadata: {
        ...currentPaper.metadata,
        ...extraction.extractionMetadata
      },
      content: {
        fullText: normalizedText,
        extractedText: extraction.extractedText,
        normalizedText,
        extractionMetadata: extraction.extractionMetadata
      }
    }));

    if (!summarizingPaper) {
      return;
    }

    const refreshed = await getPaper(paperId);

    if (!refreshed?.content) {
      throw new Error("正文提取后未写入内容。");
    }

    const summary = await summarizePaperContent(refreshed, refreshed.content.fullText);

    const readyPaper = await safeUpdatePaper(paperId, (currentPaper) => ({
      ...currentPaper,
      language: summary.language,
      status: "ready",
      summaryStatus: "ready",
      chunks: summary.chunks,
      quickSummary: summary.quickSummary,
      deepSummary: summary.deepSummary,
      content: currentPaper.content
        ? {
            ...currentPaper.content,
            chunkBriefContext: summary.chunkBriefContext
          }
        : currentPaper.content
    }));

    if (!readyPaper) {
      return;
    }
  } catch (error) {
    const failedPaper = await safeUpdatePaper(paperId, (paper) => ({
      ...paper,
      status: "failed",
      summaryStatus: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误"
    }));

    if (!failedPaper) {
      return;
    }
  }
}
