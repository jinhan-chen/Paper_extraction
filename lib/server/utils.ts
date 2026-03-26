import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import type { AnnotatedText, EvidenceSourceType, PaperChunk } from "@/lib/types";

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").replace(/[ \u00a0]{2,}/g, " ").trim();
}

export function repairBrokenPdfText(input: string) {
  const normalized = input.replace(/\r/g, "\n");

  return normalizeWhitespace(
    normalized
      .replace(/\u3000/g, " ")
      .replace(/(?<=[\u4e00-\u9fffA-Za-zＡ-Ｚａ-ｚ0-9０-９])\n(?=[\u4e00-\u9fffA-Za-zＡ-Ｚａ-ｚ0-9０-９])/gu, "")
      .replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/gu, "")
      .replace(/(?<=[A-Za-z])-\s*\n\s*(?=[A-Za-z])/g, "")
  );
}

export function trimAcademicFrontMatter(input: string) {
  const text = normalizeWhitespace(input);
  const markers = [
    "摘要",
    "摘 要",
    "Abstract",
    "ABSTRACT",
    "\n1 引言",
    "\n１ 引言",
    "\n1. 引言",
    "\n1 Introduction",
    "\nI. Introduction"
  ];

  const candidates = markers
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 20 && index <= 4_000)
    .sort((left, right) => left - right);

  return candidates.length > 0 ? text.slice(candidates[0]).trim() : text;
}

export function looksLikePoorPdfExtraction(input: string) {
  const text = input.trim();

  if (!text) {
    return true;
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return true;
  }

  const shortLineCount = lines.filter((line) => line.length <= 2).length;
  const fragmentedTransitions =
    text.match(/[\u4e00-\u9fffA-Za-zＡ-Ｚａ-ｚ0-9０-９]\n[\u4e00-\u9fffA-Za-zＡ-Ｚａ-ｚ0-9０-９]/gu)?.length ?? 0;
  const strangeSpacingRuns =
    text.match(/(?:[\u4e00-\u9fffＡ-Ｚａ-ｚ0-9０-９]\s+){8,}[\u4e00-\u9fffＡ-Ｚａ-ｚ0-9０-９]?/gu)?.length ?? 0;
  const averageLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;

  return (
    fragmentedTransitions >= 8 ||
    strangeSpacingRuns >= 2 ||
    (lines.length >= 12 && shortLineCount / lines.length > 0.22) ||
    (lines.length >= 50 && averageLineLength < 18)
  );
}

export function detectLanguage(input: string) {
  const chineseMatches = input.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  return chineseMatches > Math.max(20, input.length * 0.06) ? "zh" : "en";
}

export function stripCodeFences(raw: string) {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function extractJsonObject(raw: string) {
  const normalized = stripCodeFences(raw);
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model output did not contain a JSON object.");
  }

  return normalized.slice(firstBrace, lastBrace + 1);
}

export function parseJsonObject<T>(raw: string): T {
  return JSON.parse(extractJsonObject(raw)) as T;
}

export function splitIntoChunks(text: string, targetChars = 5_500): PaperChunk[] {
  const paragraphs = normalizeWhitespace(text).split(/\n{2,}/);
  const chunks: PaperChunk[] = [];
  let current = "";
  let order = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      continue;
    }

    if ((current + "\n\n" + paragraph).length > targetChars && current.trim()) {
      chunks.push({
        id: createId("chunk"),
        order,
        text: current.trim(),
        charCount: current.trim().length
      });
      order += 1;
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) {
    chunks.push({
      id: createId("chunk"),
      order,
      text: current.trim(),
      charCount: current.trim().length
    });
  }

  return chunks.length > 0
    ? chunks
    : [
        {
          id: createId("chunk"),
          order: 0,
          text: text.slice(0, targetChars),
          charCount: Math.min(text.length, targetChars)
        }
      ];
}

export function inferTitleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(basename(parsed.pathname)).replace(/[-_]+/g, " ") || parsed.hostname;
  } catch {
    return "网页论文";
  }
}

export function buildAnnotatedText(
  content: string,
  sourceType: EvidenceSourceType = "inferred"
): AnnotatedText {
  const normalized = content.trim();
  return normalized
    ? { content: normalized, source_type: sourceType }
    : { content: "论文未明确说明", source_type: "unknown" };
}

export function topSentences(text: string, count = 4) {
  const sentences = normalizeWhitespace(text)
    .split(/(?<=[。！？.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.slice(0, count);
}

export function summarizeExcerpt(text: string, maxChars = 220) {
  const summary = normalizeWhitespace(text).slice(0, maxChars).trim();
  return summary.length === maxChars ? `${summary}...` : summary;
}

export function scoreTextMatch(query: string, candidate: string) {
  const loweredQuery = query.toLowerCase();
  const loweredCandidate = candidate.toLowerCase();
  const terms = loweredQuery.split(/[\s,，。.!?、；;:：]+/).filter((term) => term.length > 1);

  return terms.reduce((score, term) => {
    const matches = loweredCandidate.split(term).length - 1;
    return score + matches * Math.max(term.length, 1);
  }, 0);
}
