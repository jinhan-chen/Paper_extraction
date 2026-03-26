import { z } from "zod";
import {
  buildChatPrompt,
  buildChunkBriefPrompt,
  buildChunkMergeContext,
  buildDeepAnalysisPrompt,
  buildQuickSummaryPrompt,
  buildSystemPrompt
} from "@/lib/prompts/builders";
import {
  ChatAnswerSchema,
  ChunkBriefSchema,
  DeepSummarySchema,
  QuickSummarySchema,
  type ChatAnswer,
  type ChunkBrief,
  type DeepSummary,
  type PaperChunk,
  type PaperRecord,
  type QuickSummary
} from "@/lib/types";
import {
  CHUNK_TARGET_CHARS,
  MAX_CONTEXT_CHARS
} from "@/lib/server/config";
import {
  buildAnnotatedText,
  detectLanguage,
  nowIso,
  parseJsonObject,
  splitIntoChunks,
  summarizeExcerpt,
  topSentences
} from "@/lib/server/utils";
import {
  normalizeDeepSummaryPayload,
  normalizeQuickSummaryPayload
} from "@/lib/server/services/summary-normalizers";
import { generateStructuredOutput } from "@/lib/server/services/structured-generation";

type SummaryBundle = {
  quickSummary: QuickSummary;
  deepSummary: DeepSummary;
  chunkBriefContext?: string;
  chunks: PaperChunk[];
  language: string;
};


function buildFallbackQuickSummary(title: string, content: string): QuickSummary {
  const sentences = topSentences(content, 6);
  return QuickSummarySchema.parse({
    title,
    one_liner: sentences[0] ?? "这篇论文的核心内容仍在抽取中。",
    core_problem: sentences[1] ?? sentences[0] ?? "论文未明确说明",
    method_overview: sentences[2] ?? "论文未明确说明",
    key_findings: [
      sentences[3] ?? summarizeExcerpt(content, 70),
      sentences[4] ?? "论文未明确说明",
      sentences[5] ?? "论文未明确说明"
    ],
    audience: "适合想快速理解这篇论文问题定义、方法思路和适用边界的读者。",
    reading_worth: "如果你需要快速判断这篇论文是否值得细读，这份首屏摘要已经覆盖最关键的判断信息。",
    suggested_questions: ["作者最大的 insight 是什么？", "和传统方法相比，创新点到底新在哪里？"]
  });
}

function buildFallbackDeepSummary(title: string, content: string): DeepSummary {
  const sentences = topSentences(content, 10);
  const titleLead = title.trim() || "这篇论文";

  return DeepSummarySchema.parse({
    task: {
      problem: buildAnnotatedText(sentences[0] ?? `${titleLead}试图解决一个尚需进一步形式化的研究问题。`),
      input: buildAnnotatedText(sentences[1] ?? "论文未明确说明", sentences[1] ? "inferred" : "unknown"),
      output: buildAnnotatedText(sentences[2] ?? "论文未明确说明", sentences[2] ? "inferred" : "unknown"),
      objective: buildAnnotatedText(sentences[3] ?? "论文未明确说明", sentences[3] ? "inferred" : "unknown"),
      constraints: [
        buildAnnotatedText(sentences[4] ?? "论文未明确说明", sentences[4] ? "inferred" : "unknown")
      ]
    },
    challenge: [
      {
        title: "已有方法的瓶颈",
        area: "modeling",
        explanation: sentences[5] ?? "从现有文本中可以推测，传统方法在关键建模假设上难以覆盖目标问题。",
        source_type: sentences[5] ? "inferred" : "unknown"
      }
    ],
    insight_and_novelty: {
      inspirations: [
        {
          title: "从问题本质重新组织方法",
          explanation: sentences[6] ?? "可能的启发来自作者对问题本质瓶颈的重新刻画。",
          source_type: sentences[6] ? "inferred" : "unknown"
        }
      ],
      insights: [
        {
          title: "先识别最核心的瓶颈，再重组解法",
          layer: "problem_reframing",
          problem_targeted: sentences[0] ?? "论文未明确说明",
          rationale: sentences[7] ?? "作者似乎先从问题重构入手，再设计后续方法细节。",
          inspired_by: ["从问题本质重新组织方法"],
          source_type: sentences[7] ? "inferred" : "unknown"
        }
      ],
      novelties: [
        {
          title: "默认创新点占位",
          category: "method",
          description: sentences[8] ?? "在未接入模型时，系统会先保留一个可验证的结构化创新点占位。",
          source_type: sentences[8] ? "inferred" : "unknown",
          reasoning_chain: {
            problem: sentences[5] ?? "论文未明确说明",
            inspired_by_insight: "先识别最核心的瓶颈，再重组解法",
            design: sentences[8] ?? "论文未明确说明"
          }
        }
      ]
    },
    potential_flaws: {
      scenario_limits: [
        {
          title: "新情境下的泛化压力",
          explanation: "如果输入维度、约束条件或任务目标显著增加，当前方法可能需要重新设计中间表示或训练流程。",
          extension_direction: "优先扩展到更复杂约束、多阶段决策或分布偏移场景。",
          source_type: "inferred"
        }
      ],
      data_limits: [
        {
          title: "对数据质量的敏感性",
          explanation: "噪声、长尾或标注误差可能放大该方法在表示学习或评估环节的不稳定性。",
          problematic_properties: ["噪声大", "分布偏移", "长尾", "标注误差"],
          source_type: "inferred"
        }
      ],
      research_opportunities: [
        {
          title: "把鲁棒性问题单独做成新论文",
          why_it_matters: "它直接决定方法是否能从论文环境迁移到更真实的应用环境。",
          next_direction: "沿着更强约束、更差数据、更大规模泛化这条线继续推演。",
          source_type: "inferred"
        }
      ]
    },
    motivation: {
      question_chain: [
        "如果传统方法已经能处理表面现象，真正没有被解决的本质瓶颈到底是什么？",
        "如果直接针对这个本质瓶颈重构问题表述，能不能省掉很多额外复杂设计？",
        "如果新的问题表述成立，最自然、最便宜的实现路径应该是什么？"
      ],
      summary: `在未接入模型时，系统会先基于 ${titleLead} 的正文首段和上下文信号给出一个谨慎的动机复原版本。`
    }
  });
}

async function compressLongContext(args: {
  title: string;
  sourceType: PaperRecord["sourceType"];
  language: string;
  metadata: Record<string, unknown>;
  content: string;
}) {
  const chunks = splitIntoChunks(args.content, CHUNK_TARGET_CHARS);

  if (args.content.length <= MAX_CONTEXT_CHARS || chunks.length === 1) {
    return {
      chunks,
      summaryInput: args.content
    };
  }

  const chunkBriefs: ChunkBrief[] = [];

  for (const chunk of chunks) {
    const brief = await generateStructuredOutput({
      schemaName: "chunkBrief",
      schema: ChunkBriefSchema,
      prompt: buildChunkBriefPrompt(
        {
          title: args.title,
          sourceType: args.sourceType,
          language: args.language,
          metadata: args.metadata,
          content: chunk.text
        },
        chunk.order,
        chunks.length
      ),
      fallback: () => ({
        summary: summarizeExcerpt(chunk.text, 240),
        findings: [
          topSentences(chunk.text, 3)[0] ?? summarizeExcerpt(chunk.text, 120),
          topSentences(chunk.text, 3)[1] ?? "该分块主要用于补充上下文细节。"
        ]
      })
    });
    chunkBriefs.push(brief);
  }

  return {
    chunks,
    summaryInput: buildChunkMergeContext(chunkBriefs),
    chunkBriefContext: buildChunkMergeContext(chunkBriefs)
  };
}

export async function summarizePaperContent(paper: PaperRecord, fullText: string): Promise<SummaryBundle> {
  const language = detectLanguage(fullText);
  const compressed = await compressLongContext({
    title: paper.title,
    sourceType: paper.sourceType,
    language,
    metadata: paper.metadata,
    content: fullText
  });

  const sharedContext = {
    title: paper.title,
    sourceType: paper.sourceType,
    language,
    metadata: {
      ...paper.metadata,
      processedAt: nowIso(),
      chunkCount: compressed.chunks.length
    },
    content: compressed.summaryInput
  };

  const quickSummary = await generateStructuredOutput({
    schemaName: "quickSummary",
    schema: QuickSummarySchema,
    prompt: buildQuickSummaryPrompt(sharedContext),
    fallback: () => buildFallbackQuickSummary(paper.title, compressed.summaryInput),
    normalize: normalizeQuickSummaryPayload
  });

  const deepSummary = await generateStructuredOutput({
    schemaName: "deepSummary",
    schema: DeepSummarySchema,
    prompt: buildDeepAnalysisPrompt(sharedContext),
    fallback: () => buildFallbackDeepSummary(paper.title, compressed.summaryInput),
    normalize: normalizeDeepSummaryPayload
  });

  return {
    quickSummary,
    deepSummary,
    chunkBriefContext: compressed.chunkBriefContext,
    chunks: compressed.chunks,
    language
  };
}

export async function answerQuestionWithContext(args: {
  paper: PaperRecord;
  question: string;
  supportingChunks: PaperChunk[];
}): Promise<ChatAnswer> {
  const fallbackAnswer: ChatAnswer = ChatAnswerSchema.parse({
    answer:
      args.supportingChunks.length > 0
        ? `我先基于当前命中的论文片段给出一个保守回答：\n\n${args.supportingChunks
            .map((chunk, index) => `${index + 1}. ${summarizeExcerpt(chunk.text, 160)}`)
            .join("\n")}\n\n如果你希望，我可以继续围绕 novelty、局限或实验设计进一步展开。`
        : "当前论文还没有可用的正文片段，所以暂时无法回答这个问题。",
    supporting_chunk_ids: args.supportingChunks.map((chunk) => chunk.id)
  });

  return generateStructuredOutput({
    schemaName: "chatAnswer",
    schema: ChatAnswerSchema,
    prompt: buildChatPrompt({
      title: args.paper.title,
      question: args.question,
      supportingChunks: args.supportingChunks
    }),
    fallback: () => fallbackAnswer
  });
}
