import type { ChunkBrief, ComparisonPaperSnapshot, PaperSource } from "@/lib/types";

type PromptContext = {
  title: string;
  sourceType: PaperSource;
  language: string;
  metadata: Record<string, unknown>;
  content: string;
};

function buildMetadataBlock(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) {
    return "无额外元信息";
  }

  return entries.map(([key, value]) => `- ${key}: ${String(value)}`).join("\n");
}

function buildContextBlock({ title, sourceType, language, metadata, content }: PromptContext) {
  return [
    `标题：${title}`,
    `来源类型：${sourceType === "pdf" ? "PDF 上传" : "网页链接"}`,
    `语言：${language}`,
    "元信息：",
    buildMetadataBlock(metadata),
    "",
    "论文内容：",
    content
  ].join("\n");
}

export function buildSystemPrompt() {
  return `
你是一个论文分析助手，擅长从问题本质、方法设计动机和创新链路出发解释论文。
你的任务不是复述论文，而是抽取论文最核心的研究问题、困难、洞察、创新、局限和方法动机。

请严格遵守以下规则：
1. 只能基于给定论文内容回答，不要编造论文中没有明确提到的信息。
2. 如果某一项在论文中没有直接说明，请明确写“论文未明确说明”，并使用 source_type = "unknown"。
3. 对于根据上下文做出的合理推断，必须使用 source_type = "inferred"。
4. 作者明确写出的内容使用 source_type = "explicit"。
5. 输出使用中文。
6. 只返回 JSON，不要输出 Markdown，不要额外解释。
7. 不要使用 LaTeX，公式必须用纯文本表达。
8. 避免空泛形容词，尽量给出形式化、结构化、可验证的描述。
9. 若信息不足，请用“论文未明确说明”补齐字段，而不是省略字段。
`.trim();
}

export function buildQuickSummaryPrompt(context: PromptContext) {
  return `
请为下面的论文内容生成首屏重点摘要，返回 JSON，字段必须严格包含：
{
  "title": string,
  "one_liner": string,
  "core_problem": string,
  "method_overview": string,
  "key_findings": [string, string, string],
  "audience": string,
  "reading_worth": string,
  "suggested_questions": [string, string]
}

要求：
1. 输出简洁但信息密度高，适合详情页首屏展示。
2. 不要写空话，优先回答“这篇文章值不值得读、适合谁读”。
3. 所有字段都必须存在。
4. title 必须和输入标题一致或更规范，但不能凭空改题。

${buildContextBlock(context)}
`.trim();
}

export function buildChunkBriefPrompt(context: PromptContext, index: number, total: number) {
  return `
你将收到长论文的一部分内容，请先做分块压缩，方便后续全局总结。
只返回 JSON，字段如下：
{
  "summary": string,
  "findings": [string, string]
}

要求：
1. summary 概括该分块讲了什么。
2. findings 提炼该分块里最值得保留的 2 到 4 个具体信息点。
3. 不要输出分块编号之外的多余说明。

分块 ${index + 1} / ${total}

${buildContextBlock(context)}
`.trim();
}

export function buildChunkMergeContext(chunkBriefs: ChunkBrief[]) {
  return chunkBriefs
    .map(
      (brief, index) =>
        `分块 ${index + 1}\n摘要：${brief.summary}\n要点：${brief.findings.map((item) => `- ${item}`).join("\n")}`
    )
    .join("\n\n");
}

export function buildDeepAnalysisPrompt(context: PromptContext) {
  return `
请仔细阅读并分析下面的论文内容，并返回 JSON。顶层字段必须严格为：
{
  "task": {
    "problem": {"content": string, "source_type": "explicit" | "inferred" | "unknown"},
    "input": {"content": string, "source_type": "explicit" | "inferred" | "unknown"},
    "output": {"content": string, "source_type": "explicit" | "inferred" | "unknown"},
    "objective": {"content": string, "source_type": "explicit" | "inferred" | "unknown"},
    "constraints": [{"content": string, "source_type": "explicit" | "inferred" | "unknown"}]
  },
  "challenge": [
    {
      "title": string,
      "area": "data" | "modeling" | "compute" | "generalization" | "evaluation" | "deployment",
      "explanation": string,
      "source_type": "explicit" | "inferred" | "unknown"
    }
  ],
  "insight_and_novelty": {
    "inspirations": [
      {
        "title": string,
        "explanation": string,
        "source_type": "explicit" | "inferred" | "unknown"
      }
    ],
    "insights": [
      {
        "title": string,
        "layer": "problem_reframing" | "representation" | "architecture" | "training_strategy" | "inference_strategy" | "system_design",
        "problem_targeted": string,
        "rationale": string,
        "inspired_by": [string],
        "source_type": "explicit" | "inferred" | "unknown"
      }
    ],
    "novelties": [
      {
        "title": string,
        "category": "architecture" | "method" | "strategy" | "training_objective" | "data_construction" | "system_implementation",
        "description": string,
        "source_type": "explicit" | "inferred" | "unknown",
        "reasoning_chain": {
          "problem": string,
          "inspired_by_insight": string,
          "design": string
        }
      }
    ]
  },
  "potential_flaws": {
    "scenario_limits": [
      {
        "title": string,
        "explanation": string,
        "extension_direction": string,
        "source_type": "explicit" | "inferred" | "unknown"
      }
    ],
    "data_limits": [
      {
        "title": string,
        "explanation": string,
        "problematic_properties": [string],
        "source_type": "explicit" | "inferred" | "unknown"
      }
    ],
    "research_opportunities": [
      {
        "title": string,
        "why_it_matters": string,
        "next_direction": string,
        "source_type": "explicit" | "inferred" | "unknown"
      }
    ]
  },
  "motivation": {
    "question_chain": [string, string, string],
    "summary": string
  }
}

要求：
1. 你的分析框架必须围绕 Task、Challenge、Insight & Novelty、Potential Flaws、Motivation 这 5 个模块展开。
2. Task 尽量形式化表达输入、输出、目标和约束。
3. Challenge 需要说明传统方法为什么会遇到瓶颈。
4. 对每个 novelty，reasoning_chain 必须严格体现：
   - problem: 创新点解决的问题是什么
   - inspired_by_insight: 受哪个 insight 启发
   - design: 设计了什么创新点，尽可能具体描述
5. Potential Flaws 要区分场景局限、数据局限和值得延展的研究问题。
6. Motivation 要用递进问句方式还原作者怎么想到这个 general idea。
7. 所有字段都必须存在；若信息不足，用“论文未明确说明”补齐，并配合 source_type = "unknown"。
8. 只返回 JSON，不要补充多余文字。

${buildContextBlock(context)}
`.trim();
}

export function buildChatPrompt(args: {
  title: string;
  question: string;
  supportingChunks: Array<{ id: string; text: string }>;
}) {
  const context = args.supportingChunks
    .map(
      (chunk, index) =>
        `片段 ${index + 1} (${chunk.id})\n${chunk.text}`
    )
    .join("\n\n");

  return `
请根据以下论文片段回答用户问题，只返回 JSON：
{
  "answer": string,
  "supporting_chunk_ids": [string]
}

要求：
1. 只围绕当前论文回答。
2. 如果证据不足，要明确说明“当前片段不足以完全回答该问题”。
3. supporting_chunk_ids 只能填写下面提供的片段 id。

论文标题：${args.title}
用户问题：${args.question}

相关片段：
${context}
`.trim();
}

export function buildComparisonReportPrompt(args: {
  title: string;
  focusPrompt: string;
  papers: ComparisonPaperSnapshot[];
}) {
  const paperContext = args.papers
    .map((paper, index) =>
      [
        `论文 ${index + 1}`,
        `paper_id: ${paper.paperId}`,
        `标题: ${paper.title}`,
        `一句话摘要: ${paper.oneLiner}`,
        `核心问题: ${paper.coreProblem}`,
        `方法概览: ${paper.methodOverview}`,
        `核心发现:`,
        ...paper.keyFindings.map((item) => `- ${item}`),
        `挑战:`,
        ...(paper.challenges.length > 0 ? paper.challenges.map((item) => `- ${item}`) : ["- 论文未明确说明"]),
        `创新点:`,
        ...(paper.novelties.length > 0 ? paper.novelties.map((item) => `- ${item}`) : ["- 论文未明确说明"])
      ].join("\n")
    )
    .join("\n\n");

  return `
请基于以下多篇论文的结构化摘要，生成一份综述式对比分析，只返回 JSON。顶层字段必须严格为：
{
  "theme_overview": {
    "field": string,
    "importance": string,
    "source_type": "explicit" | "inferred" | "unknown"
  },
  "paper_cards": [
    {
      "paper_id": string,
      "title": string,
      "role": string,
      "core_claim": string,
      "method_stance": string,
      "key_conclusion": string,
      "source_type": "explicit" | "inferred" | "unknown"
    }
  ],
  "consensus": [
    {
      "title": string,
      "description": string,
      "source_type": "explicit" | "inferred" | "unknown",
      "related_paper_ids": [string]
    }
  ],
  "disagreements": [
    {
      "title": string,
      "description": string,
      "conflict_type": "conclusion" | "method" | "evaluation" | "scope",
      "source_type": "explicit" | "inferred" | "unknown",
      "related_paper_ids": [string]
    }
  ],
  "connections": [
    {
      "title": string,
      "description": string,
      "relation_type": "complementary" | "progressive" | "validation" | "refutation" | "extension",
      "source_type": "explicit" | "inferred" | "unknown",
      "related_paper_ids": [string]
    }
  ],
  "method_landscape": [
    {
      "route_name": string,
      "representative_paper_ids": [string],
      "strengths": string,
      "limits": string,
      "source_type": "explicit" | "inferred" | "unknown"
    }
  ],
  "field_status": {
    "maturity": string,
    "bottlenecks": string,
    "trajectory": string,
    "source_type": "explicit" | "inferred" | "unknown"
  },
  "research_gaps": [
    {
      "title": string,
      "description": string,
      "source_type": "explicit" | "inferred" | "unknown"
    }
  ],
  "suggested_questions": [string, string]
}

要求：
1. 这是综述式全景分析，不要逐篇重复摘要，要强调共识、分歧、联系和领域现状。
2. “paper_cards”用于快速理解每篇论文在这组文献中的角色。
3. “consensus”写多篇论文共同支持的判断。
4. “disagreements”写主要冲突或矛盾来源。
5. “connections”写论文之间的互补、递进、验证、反驳或扩展关系。
6. “field_status”需要总结该研究领域当前成熟度、主要瓶颈和发展走向。
7. 所有字段都必须存在；信息不足时请写“论文未明确说明”。
8. related_paper_ids 和 representative_paper_ids 只能填写给定 paper_id。

本次综述标题：${args.title}
用户关注重点：${args.focusPrompt}

论文摘要上下文：
${paperContext}
`.trim();
}

export function buildComparisonChatPrompt(args: {
  comparisonTitle: string;
  question: string;
  reportContext: string;
  supportingPapers: ComparisonPaperSnapshot[];
}) {
  const papers = args.supportingPapers
    .map(
      (paper, index) =>
        `论文 ${index + 1} (${paper.paperId})\n标题：${paper.title}\n一句话摘要：${paper.oneLiner}\n核心问题：${paper.coreProblem}\n方法概览：${paper.methodOverview}\n核心发现：${paper.keyFindings.join("；")}`
    )
    .join("\n\n");

  return `
请根据以下“多论文综述结果 + 已选论文摘要”回答用户问题，只返回 JSON：
{
  "answer": string,
  "supporting_paper_ids": [string],
  "supporting_sections": [string]
}

要求：
1. 优先结合综述结果回答，如果综述不足，再补充论文摘要中的具体信息。
2. 只围绕当前这组已选论文回答，不要扩展到未给定文献。
3. supporting_paper_ids 只能填写下面出现的 paper_id。
4. supporting_sections 填写你主要依据的综述模块名称，例如：共识、分歧与矛盾、方法谱系、现状判断、研究空白。

综述标题：${args.comparisonTitle}
用户问题：${args.question}

综述结果摘要：
${args.reportContext}

相关论文：
${papers}
`.trim();
}
