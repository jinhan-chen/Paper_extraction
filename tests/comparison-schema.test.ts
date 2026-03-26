import { describe, expect, it } from "vitest";
import { ComparisonReportSchema } from "@/lib/types";
import { normalizeComparisonReportPayload } from "@/lib/server/services/comparison-normalizers";

describe("comparison schemas", () => {
  it("accepts a valid comparison report payload", () => {
    const parsed = ComparisonReportSchema.parse({
      theme_overview: {
        field: "这组论文共同关注多模态信息抽取",
        importance: "它们帮助梳理方法路线、评估口径和落地瓶颈。",
        source_type: "inferred"
      },
      paper_cards: [
        {
          paper_id: "paper_a",
          title: "Paper A",
          role: "提出基础范式",
          core_claim: "先统一表示再做抽取更稳",
          method_stance: "偏向表示学习路线",
          key_conclusion: "在标准数据集上表现稳定",
          source_type: "explicit"
        },
        {
          paper_id: "paper_b",
          title: "Paper B",
          role: "补强应用场景",
          core_claim: "加入规则约束可提升真实场景鲁棒性",
          method_stance: "偏向系统整合路线",
          key_conclusion: "真实业务中误报更低",
          source_type: "inferred"
        }
      ],
      consensus: [
        {
          title: "任务定义趋于稳定",
          description: "多篇论文都把重点放在复杂场景下的稳定抽取。",
          source_type: "inferred",
          related_paper_ids: ["paper_a", "paper_b"]
        }
      ],
      disagreements: [
        {
          title: "是否需要强规则约束",
          description: "有的工作更强调数据驱动，有的更强调显式规则。",
          conflict_type: "method",
          source_type: "inferred",
          related_paper_ids: ["paper_a", "paper_b"]
        }
      ],
      connections: [
        {
          title: "从范式到应用扩展",
          description: "第二篇论文建立在第一篇范式之上，进一步强调落地约束。",
          relation_type: "extension",
          source_type: "inferred",
          related_paper_ids: ["paper_a", "paper_b"]
        }
      ],
      method_landscape: [
        {
          route_name: "统一表示路线",
          representative_paper_ids: ["paper_a"],
          strengths: "表达一致性更好",
          limits: "对落地约束刻画不足",
          source_type: "explicit"
        }
      ],
      field_status: {
        maturity: "该方向已形成若干稳定基线，但尚未完全收敛。",
        bottlenecks: "统一评估口径和真实场景验证仍不足。",
        trajectory: "未来会更重视跨场景泛化与系统约束。",
        source_type: "inferred"
      },
      research_gaps: [
        {
          title: "跨场景验证不足",
          description: "现有工作更多集中于有限数据集。",
          source_type: "inferred"
        }
      ],
      suggested_questions: [
        "这组论文最大的共识是什么？",
        "哪个方法路线更适合真实应用？"
      ]
    });

    expect(parsed.paper_cards).toHaveLength(2);
    expect(parsed.disagreements[0].conflict_type).toBe("method");
  });

  it("repairs missing comparison fields before validation", () => {
    const parsed = ComparisonReportSchema.parse(
      normalizeComparisonReportPayload({
        paper_cards: [
          {
            paper_id: "paper_a"
          }
        ],
        consensus: [
          {
            title: "只有标题"
          }
        ],
        suggested_questions: ["只给一个问题"]
      })
    );

    expect(parsed.theme_overview.field).toBe("论文未明确说明");
    expect(parsed.paper_cards[0].title).toBe("论文未明确说明");
    expect(parsed.consensus[0].related_paper_ids.length).toBeGreaterThan(0);
    expect(parsed.suggested_questions).toHaveLength(2);
  });
});
