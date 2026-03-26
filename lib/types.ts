import { z } from "zod";

const RequiredTextSchema = z.string().trim().min(1);

export const EvidenceSourceTypeSchema = z.enum(["explicit", "inferred", "unknown"]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>;

export const PaperSourceSchema = z.enum(["pdf", "url"]);
export type PaperSource = z.infer<typeof PaperSourceSchema>;

export const PaperStatusSchema = z.enum([
  "queued",
  "extracting",
  "summarizing",
  "ready",
  "failed"
]);
export type PaperStatus = z.infer<typeof PaperStatusSchema>;

export const SummaryStatusSchema = z.enum(["idle", "queued", "generating", "ready", "failed"]);
export type SummaryStatus = z.infer<typeof SummaryStatusSchema>;

export const ComparisonStatusSchema = z.enum(["queued", "analyzing", "ready", "failed"]);
export type ComparisonStatus = z.infer<typeof ComparisonStatusSchema>;

export const AnnotatedTextSchema = z.object({
  content: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema
});
export type AnnotatedText = z.infer<typeof AnnotatedTextSchema>;

export const QuickSummarySchema = z.object({
  title: RequiredTextSchema,
  one_liner: RequiredTextSchema,
  core_problem: RequiredTextSchema,
  method_overview: RequiredTextSchema,
  key_findings: z.array(RequiredTextSchema).min(3).max(3),
  audience: RequiredTextSchema,
  reading_worth: RequiredTextSchema,
  suggested_questions: z.array(RequiredTextSchema).min(2).max(4)
});
export type QuickSummary = z.infer<typeof QuickSummarySchema>;

const ChallengeSchema = z.object({
  title: RequiredTextSchema,
  area: z.enum(["data", "modeling", "compute", "generalization", "evaluation", "deployment"]),
  explanation: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema
});

const InspirationSchema = z.object({
  title: RequiredTextSchema,
  explanation: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema
});

const InsightSchema = z.object({
  title: RequiredTextSchema,
  layer: z.enum([
    "problem_reframing",
    "representation",
    "architecture",
    "training_strategy",
    "inference_strategy",
    "system_design"
  ]),
  problem_targeted: RequiredTextSchema,
  rationale: RequiredTextSchema,
  inspired_by: z.array(RequiredTextSchema),
  source_type: EvidenceSourceTypeSchema
});

const NoveltySchema = z.object({
  title: RequiredTextSchema,
  category: z.enum([
    "architecture",
    "method",
    "strategy",
    "training_objective",
    "data_construction",
    "system_implementation"
  ]),
  description: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema,
  reasoning_chain: z.object({
    problem: RequiredTextSchema,
    inspired_by_insight: RequiredTextSchema,
    design: RequiredTextSchema
  })
});

const ScenarioLimitSchema = z.object({
  title: RequiredTextSchema,
  explanation: RequiredTextSchema,
  extension_direction: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema
});

const DataLimitSchema = z.object({
  title: RequiredTextSchema,
  explanation: RequiredTextSchema,
  problematic_properties: z.array(RequiredTextSchema).min(1),
  source_type: EvidenceSourceTypeSchema
});

const ResearchOpportunitySchema = z.object({
  title: RequiredTextSchema,
  why_it_matters: RequiredTextSchema,
  next_direction: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema
});

export const DeepSummarySchema = z.object({
  task: z.object({
    problem: AnnotatedTextSchema,
    input: AnnotatedTextSchema,
    output: AnnotatedTextSchema,
    objective: AnnotatedTextSchema,
    constraints: z.array(AnnotatedTextSchema)
  }),
  challenge: z.array(ChallengeSchema),
  insight_and_novelty: z.object({
    inspirations: z.array(InspirationSchema),
    insights: z.array(InsightSchema),
    novelties: z.array(NoveltySchema)
  }),
  potential_flaws: z.object({
    scenario_limits: z.array(ScenarioLimitSchema),
    data_limits: z.array(DataLimitSchema),
    research_opportunities: z.array(ResearchOpportunitySchema)
  }),
  motivation: z.object({
    question_chain: z.array(RequiredTextSchema).min(3),
    summary: RequiredTextSchema
  })
});
export type DeepSummary = z.infer<typeof DeepSummarySchema>;

export const ChunkBriefSchema = z.object({
  summary: RequiredTextSchema,
  findings: z.array(RequiredTextSchema).min(2).max(4)
});
export type ChunkBrief = z.infer<typeof ChunkBriefSchema>;

export const ChatAnswerSchema = z.object({
  answer: RequiredTextSchema,
  supporting_chunk_ids: z.array(RequiredTextSchema)
});
export type ChatAnswer = z.infer<typeof ChatAnswerSchema>;

export const PaperChunkSchema = z.object({
  id: RequiredTextSchema,
  order: z.number().int().nonnegative(),
  text: RequiredTextSchema,
  charCount: z.number().int().positive()
});
export type PaperChunk = z.infer<typeof PaperChunkSchema>;

export const ChatMessageSchema = z.object({
  id: RequiredTextSchema,
  role: z.enum(["user", "assistant"]),
  content: RequiredTextSchema,
  createdAt: RequiredTextSchema,
  supportingChunkIds: z.array(RequiredTextSchema).default([])
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ComparisonChatMessageSchema = z.object({
  id: RequiredTextSchema,
  role: z.enum(["user", "assistant"]),
  content: RequiredTextSchema,
  createdAt: RequiredTextSchema,
  supportingPaperIds: z.array(RequiredTextSchema).default([]),
  supportingSections: z.array(RequiredTextSchema).default([])
});
export type ComparisonChatMessage = z.infer<typeof ComparisonChatMessageSchema>;

export const PaperContentSchema = z.object({
  fullText: RequiredTextSchema,
  extractedText: z.string(),
  normalizedText: RequiredTextSchema,
  chunkBriefContext: z.string().optional(),
  extractionMetadata: z.record(z.string(), z.unknown()).default({})
});
export type PaperContent = z.infer<typeof PaperContentSchema>;

export const PaperRecordSchema = z.object({
  id: RequiredTextSchema,
  userId: RequiredTextSchema,
  title: RequiredTextSchema,
  sourceType: PaperSourceSchema,
  sourceUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  language: z.string().optional(),
  status: PaperStatusSchema,
  summaryStatus: SummaryStatusSchema,
  errorMessage: z.string().optional(),
  createdAt: RequiredTextSchema,
  updatedAt: RequiredTextSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  content: PaperContentSchema.optional(),
  chunks: z.array(PaperChunkSchema).default([]),
  quickSummary: QuickSummarySchema.optional(),
  deepSummary: DeepSummarySchema.optional(),
  chatMessages: z.array(ChatMessageSchema).default([])
});
export type PaperRecord = z.infer<typeof PaperRecordSchema>;

export const ComparisonPaperSnapshotSchema = z.object({
  paperId: RequiredTextSchema,
  title: RequiredTextSchema,
  oneLiner: RequiredTextSchema,
  coreProblem: RequiredTextSchema,
  methodOverview: RequiredTextSchema,
  keyFindings: z.array(RequiredTextSchema).min(1),
  challenges: z.array(RequiredTextSchema).default([]),
  novelties: z.array(RequiredTextSchema).default([]),
  roleHint: z.string().default(""),
  sourceType: EvidenceSourceTypeSchema.default("inferred")
});
export type ComparisonPaperSnapshot = z.infer<typeof ComparisonPaperSnapshotSchema>;

const ComparisonItemSchema = z.object({
  title: RequiredTextSchema,
  description: RequiredTextSchema,
  source_type: EvidenceSourceTypeSchema,
  related_paper_ids: z.array(RequiredTextSchema).default([])
});

export const ComparisonReportSchema = z.object({
  theme_overview: z.object({
    field: RequiredTextSchema,
    importance: RequiredTextSchema,
    source_type: EvidenceSourceTypeSchema
  }),
  paper_cards: z.array(
    z.object({
      paper_id: RequiredTextSchema,
      title: RequiredTextSchema,
      role: RequiredTextSchema,
      core_claim: RequiredTextSchema,
      method_stance: RequiredTextSchema,
      key_conclusion: RequiredTextSchema,
      source_type: EvidenceSourceTypeSchema
    })
  ),
  consensus: z.array(ComparisonItemSchema),
  disagreements: z.array(
    ComparisonItemSchema.extend({
      conflict_type: z.enum(["conclusion", "method", "evaluation", "scope"])
    })
  ),
  connections: z.array(
    ComparisonItemSchema.extend({
      relation_type: z.enum(["complementary", "progressive", "validation", "refutation", "extension"])
    })
  ),
  method_landscape: z.array(
    z.object({
      route_name: RequiredTextSchema,
      representative_paper_ids: z.array(RequiredTextSchema).min(1),
      strengths: RequiredTextSchema,
      limits: RequiredTextSchema,
      source_type: EvidenceSourceTypeSchema
    })
  ),
  field_status: z.object({
    maturity: RequiredTextSchema,
    bottlenecks: RequiredTextSchema,
    trajectory: RequiredTextSchema,
    source_type: EvidenceSourceTypeSchema
  }),
  research_gaps: z.array(
    z.object({
      title: RequiredTextSchema,
      description: RequiredTextSchema,
      source_type: EvidenceSourceTypeSchema
    })
  ),
  suggested_questions: z.array(RequiredTextSchema).min(2).max(6)
});
export type ComparisonReport = z.infer<typeof ComparisonReportSchema>;

export const ComparisonRecordSchema = z.object({
  id: RequiredTextSchema,
  userId: RequiredTextSchema,
  title: RequiredTextSchema,
  paperIds: z.array(RequiredTextSchema).min(2).max(10),
  focusPrompt: RequiredTextSchema,
  status: ComparisonStatusSchema,
  errorMessage: z.string().optional(),
  createdAt: RequiredTextSchema,
  updatedAt: RequiredTextSchema,
  paperSnapshots: z.array(ComparisonPaperSnapshotSchema).default([]),
  reportJson: ComparisonReportSchema.optional(),
  chatMessages: z.array(ComparisonChatMessageSchema).default([])
});
export type ComparisonRecord = z.infer<typeof ComparisonRecordSchema>;

export const DatabaseSchema = z.object({
  papers: z.array(PaperRecordSchema),
  comparisons: z.array(ComparisonRecordSchema).default([])
});
export type Database = z.infer<typeof DatabaseSchema>;

export const UNKNOWN_TEXT: AnnotatedText = {
  content: "论文未明确说明",
  source_type: "unknown"
};
