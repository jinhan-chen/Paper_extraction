import type { AnnotatedText, DeepSummary, EvidenceSourceType, QuickSummary } from "@/lib/types";

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

function normalizeStringArray(
  value: unknown,
  options: { min: number; max?: number; fallbackItems?: string[] }
) {
  const items = Array.isArray(value)
    ? value
        .map((item) => normalizeText(item, ""))
        .filter(Boolean)
    : [];

  const merged = items.length > 0 ? items : [...(options.fallbackItems ?? [FALLBACK_TEXT])];

  while (merged.length < options.min) {
    merged.push(options.fallbackItems?.[merged.length] ?? FALLBACK_TEXT);
  }

  return merged.slice(0, options.max ?? merged.length);
}

function normalizeAnnotatedText(value: unknown): AnnotatedText {
  const record = asRecord(value);
  return {
    content: normalizeText(record.content),
    source_type: normalizeSourceType(record.source_type)
  };
}

export function normalizeQuickSummaryPayload(payload: unknown): QuickSummary {
  const record = asRecord(payload);

  return {
    title: normalizeText(record.title, "未命名论文"),
    one_liner: normalizeText(record.one_liner),
    core_problem: normalizeText(record.core_problem),
    method_overview: normalizeText(record.method_overview),
    key_findings: normalizeStringArray(record.key_findings, {
      min: 3,
      max: 3,
      fallbackItems: [FALLBACK_TEXT, FALLBACK_TEXT, FALLBACK_TEXT]
    }),
    audience: normalizeText(record.audience),
    reading_worth: normalizeText(record.reading_worth),
    suggested_questions: normalizeStringArray(record.suggested_questions, {
      min: 2,
      max: 4,
      fallbackItems: ["作者最大的 insight 是什么？", "和传统方法相比，创新点到底新在哪里？"]
    })
  };
}

export function normalizeDeepSummaryPayload(payload: unknown): DeepSummary {
  const root = asRecord(payload);
  const task = asRecord(root.task);
  const insightAndNovelty = asRecord(root.insight_and_novelty);
  const potentialFlaws = asRecord(root.potential_flaws);
  const motivation = asRecord(root.motivation);

  const challenge: DeepSummary["challenge"] = (Array.isArray(root.challenge) ? root.challenge : []).map(
    (item): DeepSummary["challenge"][number] => {
      const record = asRecord(item);
      const area = record.area;

      return {
        title: normalizeText(record.title),
        area:
          area === "data" ||
          area === "modeling" ||
          area === "compute" ||
          area === "generalization" ||
          area === "evaluation" ||
          area === "deployment"
            ? area
            : "modeling",
        explanation: normalizeText(record.explanation),
        source_type: normalizeSourceType(record.source_type)
      };
    }
  );

  const inspirations: DeepSummary["insight_and_novelty"]["inspirations"] = (
    Array.isArray(insightAndNovelty.inspirations) ? insightAndNovelty.inspirations : []
  ).map((item): DeepSummary["insight_and_novelty"]["inspirations"][number] => {
    const record = asRecord(item);
    return {
      title: normalizeText(record.title),
      explanation: normalizeText(record.explanation),
      source_type: normalizeSourceType(record.source_type)
    };
  });

  const insights: DeepSummary["insight_and_novelty"]["insights"] = (
    Array.isArray(insightAndNovelty.insights) ? insightAndNovelty.insights : []
  ).map((item): DeepSummary["insight_and_novelty"]["insights"][number] => {
      const record = asRecord(item);
      const layer = record.layer;

      return {
        title: normalizeText(record.title),
        layer:
          layer === "problem_reframing" ||
          layer === "representation" ||
          layer === "architecture" ||
          layer === "training_strategy" ||
          layer === "inference_strategy" ||
          layer === "system_design"
            ? layer
            : "problem_reframing",
        problem_targeted: normalizeText(record.problem_targeted),
        rationale: normalizeText(record.rationale),
        inspired_by: normalizeStringArray(record.inspired_by, { min: 1, fallbackItems: [FALLBACK_TEXT] }),
        source_type: normalizeSourceType(record.source_type)
      };
    });

  const novelties: DeepSummary["insight_and_novelty"]["novelties"] = (
    Array.isArray(insightAndNovelty.novelties) ? insightAndNovelty.novelties : []
  ).map((item): DeepSummary["insight_and_novelty"]["novelties"][number] => {
      const record = asRecord(item);
      const reasoning = asRecord(record.reasoning_chain);
      const category = record.category;

      return {
        title: normalizeText(record.title),
        category:
          category === "architecture" ||
          category === "method" ||
          category === "strategy" ||
          category === "training_objective" ||
          category === "data_construction" ||
          category === "system_implementation"
            ? category
            : "method",
        description: normalizeText(record.description),
        source_type: normalizeSourceType(record.source_type),
        reasoning_chain: {
          problem: normalizeText(reasoning.problem),
          inspired_by_insight: normalizeText(reasoning.inspired_by_insight),
          design: normalizeText(reasoning.design)
        }
      };
    });

  const scenarioLimits: DeepSummary["potential_flaws"]["scenario_limits"] = (
    Array.isArray(potentialFlaws.scenario_limits) ? potentialFlaws.scenario_limits : []
  ).map((item): DeepSummary["potential_flaws"]["scenario_limits"][number] => {
    const record = asRecord(item);
    return {
      title: normalizeText(record.title),
      explanation: normalizeText(record.explanation),
      extension_direction: normalizeText(record.extension_direction),
      source_type: normalizeSourceType(record.source_type)
    };
  });

  const dataLimits: DeepSummary["potential_flaws"]["data_limits"] = (
    Array.isArray(potentialFlaws.data_limits) ? potentialFlaws.data_limits : []
  ).map((item): DeepSummary["potential_flaws"]["data_limits"][number] => {
      const record = asRecord(item);
      return {
        title: normalizeText(record.title),
        explanation: normalizeText(record.explanation),
        problematic_properties: normalizeStringArray(record.problematic_properties, {
          min: 1,
          fallbackItems: [FALLBACK_TEXT]
        }),
        source_type: normalizeSourceType(record.source_type)
      };
    });

  const researchOpportunities: DeepSummary["potential_flaws"]["research_opportunities"] = (
    Array.isArray(potentialFlaws.research_opportunities) ? potentialFlaws.research_opportunities : []
  ).map((item): DeepSummary["potential_flaws"]["research_opportunities"][number] => {
    const record = asRecord(item);
    return {
      title: normalizeText(record.title),
      why_it_matters: normalizeText(record.why_it_matters),
      next_direction: normalizeText(record.next_direction),
      source_type: normalizeSourceType(record.source_type)
    };
  });

  return {
    task: {
      problem: normalizeAnnotatedText(task.problem),
      input: normalizeAnnotatedText(task.input),
      output: normalizeAnnotatedText(task.output),
      objective: normalizeAnnotatedText(task.objective),
      constraints: (Array.isArray(task.constraints) ? task.constraints : [undefined]).map(normalizeAnnotatedText)
    },
    challenge:
      challenge.length > 0
        ? challenge
        : [
            {
              title: FALLBACK_TEXT,
              area: "modeling",
              explanation: FALLBACK_TEXT,
              source_type: "unknown"
            }
          ],
    insight_and_novelty: {
      inspirations:
        inspirations.length > 0
          ? inspirations
          : [{ title: FALLBACK_TEXT, explanation: FALLBACK_TEXT, source_type: "unknown" }],
      insights:
        insights.length > 0
          ? insights
          : [
              {
                title: FALLBACK_TEXT,
                layer: "problem_reframing",
                problem_targeted: FALLBACK_TEXT,
                rationale: FALLBACK_TEXT,
                inspired_by: [FALLBACK_TEXT],
                source_type: "unknown"
              }
            ],
      novelties:
        novelties.length > 0
          ? novelties
          : [
              {
                title: FALLBACK_TEXT,
                category: "method",
                description: FALLBACK_TEXT,
                source_type: "unknown",
                reasoning_chain: {
                  problem: FALLBACK_TEXT,
                  inspired_by_insight: FALLBACK_TEXT,
                  design: FALLBACK_TEXT
                }
              }
            ]
    },
    potential_flaws: {
      scenario_limits:
        scenarioLimits.length > 0
          ? scenarioLimits
          : [
              {
                title: FALLBACK_TEXT,
                explanation: FALLBACK_TEXT,
                extension_direction: FALLBACK_TEXT,
                source_type: "unknown"
              }
            ],
      data_limits:
        dataLimits.length > 0
          ? dataLimits
          : [
              {
                title: FALLBACK_TEXT,
                explanation: FALLBACK_TEXT,
                problematic_properties: [FALLBACK_TEXT],
                source_type: "unknown"
              }
            ],
      research_opportunities:
        researchOpportunities.length > 0
          ? researchOpportunities
          : [
              {
                title: FALLBACK_TEXT,
                why_it_matters: FALLBACK_TEXT,
                next_direction: FALLBACK_TEXT,
                source_type: "unknown"
              }
            ]
    },
    motivation: {
      question_chain: normalizeStringArray(motivation.question_chain, {
        min: 3,
        fallbackItems: [
          "这个问题真正的本质瓶颈是什么？",
          "如果直接针对本质瓶颈重构问题，该怎么改？",
          "顺着这个改法，最自然的方法设计应该是什么？"
        ]
      }),
      summary: normalizeText(motivation.summary)
    }
  };
}
