export type LlmProvider = "dashscope" | "openrouter";

export const DEFAULT_USER_ID = "demo-user";
export const MAX_CONTEXT_CHARS = 15_000;
export const CHUNK_TARGET_CHARS = 5_500;
export const PDF_DIRECT_TEXT_THRESHOLD = 800;

function normalizeProvider(value: string | undefined): LlmProvider | undefined {
  return value === "dashscope" || value === "openrouter" ? value : undefined;
}

export function getLlmProvider(): LlmProvider {
  const explicitProvider = normalizeProvider(process.env.LLM_PROVIDER);
  const hasDashScopeKey = Boolean(process.env.DASHSCOPE_API_KEY?.trim());
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  if (explicitProvider === "dashscope") {
    if (hasDashScopeKey) {
      return "dashscope";
    }

    if (hasOpenRouterKey) {
      return "openrouter";
    }
  }

  if (explicitProvider === "openrouter") {
    if (hasOpenRouterKey) {
      return "openrouter";
    }

    if (hasDashScopeKey) {
      return "dashscope";
    }
  }

  if (hasDashScopeKey) {
    return "dashscope";
  }

  if (hasOpenRouterKey) {
    return "openrouter";
  }

  return "dashscope";
}

export function getProviderApiKey(provider = getLlmProvider()) {
  const raw = provider === "dashscope"
    ? process.env.DASHSCOPE_API_KEY
    : process.env.OPENROUTER_API_KEY;

  const normalized = raw?.trim();
  return normalized ? normalized : undefined;
}

export function getProviderBaseUrl(provider = getLlmProvider()) {
  return provider === "dashscope"
    ? process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"
    : process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
}

export function getChatModel(provider = getLlmProvider()) {
  return provider === "dashscope"
    ? process.env.DASHSCOPE_MODEL ?? "qwen3.5-plus"
    : process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini";
}

export function getPdfModel(provider = getLlmProvider()) {
  return provider === "dashscope"
    ? process.env.DASHSCOPE_PDF_MODEL ?? "qwen-long"
    : process.env.OPENROUTER_PDF_MODEL ?? getChatModel(provider);
}

export function getOpenRouterPdfEngine() {
  return process.env.OPENROUTER_PDF_ENGINE ?? "mistral-ocr";
}
