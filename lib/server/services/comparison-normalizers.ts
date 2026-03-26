import type { ComparisonReport, EvidenceSourceType } from "@/lib/types";

const FALLBACK_TEXT = "论文未明确说明";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeText(value: unknown, fallback = FALLBACK_TEXT) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSourceType(value: unknown): EvidenceSourceType {
  return value === "explicit" || value === "inferred" || value === "unknown"
    ? value
    : "unknown";
}

function normalizeStringArray(value: unknown, min: number, fallbackItems: string[]) {
  const items = Array.isArray(value)
    ? value.map((item) => normalizeText(item, "")).filter(Boolean)
    : [];

  const merged = items.length > 0 ? items : [...fallbackItems];
  while (merged.length < min) {
    merged.push(fallbackItems[merged.length] ?? FALLBACK_TEXT);
  }
  return merged;
}

export function normalizeComparisonReportPayload(payload: unknown): ComparisonReport {
  const root = asRecord(payload);
  const theme = asRecord(root.theme_overview);
  const fieldStatus = asRecord(root.field_status);

  return {
    theme_overview: {
      field: normalizeText(theme.field),
      importance: normalizeText(theme.importance),
      source_type: normalizeSourceType(theme.source_type)
    },
    paper_cards: (Array.isArray(root.paper_cards) ? root.paper_cards : [undefined]).map((item) => {
      const record = asRecord(item);
      return {
        paper_id: normalizeText(record.paper_id),
        title: normalizeText(record.title),
        role: normalizeText(record.role),
        core_claim: normalizeText(record.core_claim),
        method_stance: normalizeText(record.method_stance),
        key_conclusion: normalizeText(record.key_conclusion),
        source_type: normalizeSourceType(record.source_type)
      };
    }),
    consensus: (Array.isArray(root.consensus) ? root.consensus : [undefined]).map((item) => {
      const record = asRecord(item);
      return {
        title: normalizeText(record.title),
        description: normalizeText(record.description),
        source_type: normalizeSourceType(record.source_type),
        related_paper_ids: normalizeStringArray(record.related_paper_ids, 1, [FALLBACK_TEXT])
      };
    }),
    disagreements: (Array.isArray(root.disagreements) ? root.disagreements : [undefined]).map((item) => {
      const record = asRecord(item);
      const conflictType = record.conflict_type;
      return {
        title: normalizeText(record.title),
        description: normalizeText(record.description),
        conflict_type:
          conflictType === "conclusion" ||
          conflictType === "method" ||
          conflictType === "evaluation" ||
          conflictType === "scope"
            ? conflictType
            : "conclusion",
        source_type: normalizeSourceType(record.source_type),
        related_paper_ids: normalizeStringArray(record.related_paper_ids, 1, [FALLBACK_TEXT])
      };
    }),
    connections: (Array.isArray(root.connections) ? root.connections : [undefined]).map((item) => {
      const record = asRecord(item);
      const relationType = record.relation_type;
      return {
        title: normalizeText(record.title),
        description: normalizeText(record.description),
        relation_type:
          relationType === "complementary" ||
          relationType === "progressive" ||
          relationType === "validation" ||
          relationType === "refutation" ||
          relationType === "extension"
            ? relationType
            : "complementary",
        source_type: normalizeSourceType(record.source_type),
        related_paper_ids: normalizeStringArray(record.related_paper_ids, 1, [FALLBACK_TEXT])
      };
    }),
    method_landscape: (Array.isArray(root.method_landscape) ? root.method_landscape : [undefined]).map((item) => {
      const record = asRecord(item);
      return {
        route_name: normalizeText(record.route_name),
        representative_paper_ids: normalizeStringArray(record.representative_paper_ids, 1, [FALLBACK_TEXT]),
        strengths: normalizeText(record.strengths),
        limits: normalizeText(record.limits),
        source_type: normalizeSourceType(record.source_type)
      };
    }),
    field_status: {
      maturity: normalizeText(fieldStatus.maturity),
      bottlenecks: normalizeText(fieldStatus.bottlenecks),
      trajectory: normalizeText(fieldStatus.trajectory),
      source_type: normalizeSourceType(fieldStatus.source_type)
    },
    research_gaps: (Array.isArray(root.research_gaps) ? root.research_gaps : [undefined]).map((item) => {
      const record = asRecord(item);
      return {
        title: normalizeText(record.title),
        description: normalizeText(record.description),
        source_type: normalizeSourceType(record.source_type)
      };
    }),
    suggested_questions: normalizeStringArray(root.suggested_questions, 2, [
      "这组论文最大的分歧到底在哪里？",
      "这个研究领域下一步最值得补哪块空白？"
    ]).slice(0, 6)
  };
}
