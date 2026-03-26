import { z } from "zod";
import { buildSystemPrompt } from "@/lib/prompts/builders";
import { getChatModel, getLlmProvider, getProviderApiKey, getProviderBaseUrl } from "@/lib/server/config";
import { parseJsonObject } from "@/lib/server/utils";

export function resolveMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n");
  }

  return "";
}

export async function callJsonModel(prompt: string) {
  const provider = getLlmProvider();
  const apiKey = getProviderApiKey(provider);

  if (!apiKey) {
    throw new Error(`未配置 ${provider === "dashscope" ? "DASHSCOPE_API_KEY" : "OPENROUTER_API_KEY"}。`);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.APP_BASE_URL ?? "http://localhost:3000";
    headers["X-Title"] = "Paper Focus";
  }

  const response = await fetch(`${getProviderBaseUrl(provider)}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: getChatModel(provider),
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`模型调用失败：${payload}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = resolveMessageContent(payload.choices?.[0]?.message?.content);

  if (!content.trim()) {
    throw new Error("模型未返回有效内容。");
  }

  return content;
}

export async function generateStructuredOutput<TSchema extends z.ZodTypeAny>({
  schemaName,
  schema,
  prompt,
  fallback,
  normalize
}: {
  schemaName: string;
  schema: TSchema;
  prompt: string;
  fallback: () => z.output<TSchema>;
  normalize?: (payload: unknown) => unknown;
}): Promise<z.output<TSchema>> {
  if (!getProviderApiKey()) {
    return schema.parse(fallback());
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callJsonModel(prompt);
      const parsed = parseJsonObject<unknown>(raw);
      return schema.parse(normalize ? normalize(parsed) : parsed);
    } catch (error) {
      lastError = error;
    }
  }

  try {
    return schema.parse(fallback());
  } catch {
    throw new Error(
      `结构化输出在两次尝试后依然失败 (${schemaName})：${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }
}
