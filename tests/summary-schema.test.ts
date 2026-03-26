import { describe, expect, it } from "vitest";
import { DeepSummarySchema, QuickSummarySchema } from "@/lib/types";
import {
  normalizeDeepSummaryPayload,
  normalizeQuickSummaryPayload
} from "@/lib/server/services/summary-normalizers";

describe("summary schemas", () => {
  it("accepts a valid quick summary payload", () => {
    const parsed = QuickSummarySchema.parse({
      title: "Test Paper",
      one_liner: "这是一句总览。",
      core_problem: "作者想解决一个明确的研究问题。",
      method_overview: "方法主要由检索与生成组成。",
      key_findings: ["发现一", "发现二", "发现三"],
      audience: "适合研究生和工程师。",
      reading_worth: "适合快速判断方法是否值得细读。",
      suggested_questions: ["创新点是什么？", "和 baseline 差异在哪？"]
    });

    expect(parsed.key_findings).toHaveLength(3);
  });

  it("accepts deep summary payloads with unknown source types", () => {
    const parsed = DeepSummarySchema.parse({
      task: {
        problem: { content: "论文未明确说明", source_type: "unknown" },
        input: { content: "图像与文本输入。", source_type: "inferred" },
        output: { content: "生成统一的检索结果。", source_type: "explicit" },
        objective: { content: "提升复杂场景下的召回质量。", source_type: "inferred" },
        constraints: [{ content: "论文未明确说明", source_type: "unknown" }]
      },
      challenge: [
        {
          title: "跨模态对齐不稳",
          area: "modeling",
          explanation: "传统方法难以同时保持表示一致性和可扩展性。",
          source_type: "explicit"
        }
      ],
      insight_and_novelty: {
        inspirations: [
          {
            title: "先对齐再聚合",
            explanation: "作者可能受到两阶段系统设计启发。",
            source_type: "inferred"
          }
        ],
        insights: [
          {
            title: "先识别主瓶颈",
            layer: "problem_reframing",
            problem_targeted: "跨模态对齐不稳",
            rationale: "先把问题重写成对齐问题再做设计更自然。",
            inspired_by: ["先对齐再聚合"],
            source_type: "inferred"
          }
        ],
        novelties: [
          {
            title: "双阶段聚合器",
            category: "architecture",
            description: "通过双阶段聚合提升对复杂输入的覆盖能力。",
            source_type: "explicit",
            reasoning_chain: {
              problem: "跨模态对齐不稳",
              inspired_by_insight: "先识别主瓶颈",
              design: "先做粗粒度对齐，再做细粒度聚合。"
            }
          }
        ]
      },
      potential_flaws: {
        scenario_limits: [
          {
            title: "大规模部署压力",
            explanation: "当实时性要求更高时，双阶段架构可能带来额外延迟。",
            extension_direction: "继续研究稀疏路由或增量更新。",
            source_type: "inferred"
          }
        ],
        data_limits: [
          {
            title: "长尾与噪声影响",
            explanation: "长尾和噪声可能导致聚合器学习到偏置表示。",
            problematic_properties: ["长尾", "噪声大"],
            source_type: "inferred"
          }
        ],
        research_opportunities: [
          {
            title: "鲁棒性扩展",
            why_it_matters: "它决定方法能否稳定迁移到真实数据。",
            next_direction: "研究更稳的训练目标和难例采样。",
            source_type: "inferred"
          }
        ]
      },
      motivation: {
        question_chain: [
          "如果已有方法都做对齐，为什么仍然不稳？",
          "是不是问题定义本身就少了一个中间层？",
          "如果补上这个中间层，最自然的架构变化是什么？"
        ],
        summary: "作者可能是从问题分解的角度想到这个方法的。"
      }
    });

    expect(parsed.task.problem.source_type).toBe("unknown");
    expect(parsed.insight_and_novelty.novelties[0].reasoning_chain.design).toContain("细粒度");
  });

  it("repairs missing quick summary fields before validation", () => {
    const parsed = QuickSummarySchema.parse(
      normalizeQuickSummaryPayload({
        title: "Repair Test",
        one_liner: "保留一句话。",
        key_findings: ["只给一条"]
      })
    );

    expect(parsed.key_findings).toHaveLength(3);
    expect(parsed.core_problem).toBe("论文未明确说明");
    expect(parsed.suggested_questions.length).toBeGreaterThanOrEqual(2);
  });

  it("repairs missing deep summary nested fields before validation", () => {
    const parsed = DeepSummarySchema.parse(
      normalizeDeepSummaryPayload({
        task: {
          problem: { content: "研究问题", source_type: "explicit" }
        },
        potential_flaws: {
          research_opportunities: [
            {
              title: "一个延伸方向",
              next_direction: "继续做下去"
            }
          ]
        },
        motivation: {
          question_chain: ["第一个问题"]
        }
      })
    );

    expect(parsed.potential_flaws.research_opportunities[0].why_it_matters).toBe("论文未明确说明");
    expect(parsed.motivation.question_chain).toHaveLength(3);
    expect(parsed.task.input.content).toBe("论文未明确说明");
  });
});
