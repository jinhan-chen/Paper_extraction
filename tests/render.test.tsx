import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeepSummarySection } from "@/components/deep-summary-section";
import { QuickSummaryCard } from "@/components/quick-summary-card";
import type { PaperRecord } from "@/lib/types";

const basePaper: PaperRecord = {
  id: "paper_test",
  userId: "demo-user",
  title: "A Test Paper",
  sourceType: "pdf",
  fileName: "test.pdf",
  filePath: "/tmp/test.pdf",
  status: "ready",
  summaryStatus: "ready",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  metadata: {},
  chunks: [],
  chatMessages: [],
  quickSummary: {
    title: "A Test Paper",
    one_liner: "这是首屏摘要的一句话。",
    core_problem: "解决复杂任务下的信息抽取问题。",
    method_overview: "通过结构化 schema 和长文分块完成总结。",
    key_findings: ["发现一", "发现二", "发现三"],
    audience: "适合需要快速理解论文价值的读者。",
    reading_worth: "适合快速筛选值得细读的论文。",
    suggested_questions: ["创新点是什么？", "局限在哪？"]
  },
  deepSummary: {
    task: {
      problem: { content: "解决论文自动总结的稳定性问题。", source_type: "explicit" },
      input: { content: "PDF 或网页正文。", source_type: "explicit" },
      output: { content: "结构化摘要与深度分析。", source_type: "explicit" },
      objective: { content: "提升总结稳定性和可展示性。", source_type: "explicit" },
      constraints: [{ content: "需要通过 JSON schema 校验。", source_type: "explicit" }]
    },
    challenge: [
      {
        title: "输出不稳定",
        area: "evaluation",
        explanation: "纯 markdown 输出难以可靠渲染。",
        source_type: "explicit"
      }
    ],
    insight_and_novelty: {
      inspirations: [
        {
          title: "结构先行",
          explanation: "先固定展示结构再让模型填充内容。",
          source_type: "explicit"
        }
      ],
      insights: [
        {
          title: "双层输出",
          layer: "system_design",
          problem_targeted: "首屏信息过重",
          rationale: "首屏和深度分析拆开后更容易阅读。",
          inspired_by: ["结构先行"],
          source_type: "explicit"
        }
      ],
      novelties: [
        {
          title: "统一摘要 schema",
          category: "system_implementation",
          description: "把 prompt 输出统一成两层 JSON 结构。",
          source_type: "explicit",
          reasoning_chain: {
            problem: "markdown 渲染不稳定",
            inspired_by_insight: "双层输出",
            design: "首屏摘要和深度分析分别建模。"
          }
        }
      ]
    },
    potential_flaws: {
      scenario_limits: [
        {
          title: "更复杂的学科模板",
          explanation: "如果要支持学科专属模板，当前固定结构需要继续扩展。",
          extension_direction: "引入 template_key 与动态 schema。",
          source_type: "inferred"
        }
      ],
      data_limits: [
        {
          title: "正文提取失败",
          explanation: "如果原始正文提取质量差，后续总结质量也会下降。",
          problematic_properties: ["OCR 误差", "网页正文噪声"],
          source_type: "explicit"
        }
      ],
      research_opportunities: [
        {
          title: "引用证据增强",
          why_it_matters: "可以显著提高总结可信度。",
          next_direction: "为每个字段补充 evidence spans。",
          source_type: "inferred"
        }
      ]
    },
    motivation: {
      question_chain: [
        "为什么页面总是被大段文字淹没？",
        "能不能先给一层速读，再给一层深挖？",
        "如果前端自己渲染结构，输出是不是会更稳？"
      ],
      summary: "整套设计是从阅读负担和输出稳定性两个本质问题反推出来的。"
    }
  }
};

describe("rendering", () => {
  it("renders quick summary content", () => {
    render(<QuickSummaryCard paper={basePaper} />);

    expect(screen.getByText("首屏重点摘要")).toBeInTheDocument();
    expect(screen.getByText("这是首屏摘要的一句话。")).toBeInTheDocument();
    expect(screen.getByText("发现三")).toBeInTheDocument();
  });

  it("renders deep summary badges and collapsible sections", () => {
    render(<DeepSummarySection paper={basePaper} />);

    expect(screen.getByText("深度分析")).toBeInTheDocument();
    expect(screen.getAllByText("原文明确").length).toBeGreaterThan(0);
    expect(screen.getByText("Potential Flaws")).toBeInTheDocument();
    expect(screen.getByText("Motivation")).toBeInTheDocument();
  });
});
