import { readFile } from "node:fs/promises";
import {
  PDF_DIRECT_TEXT_THRESHOLD,
  getLlmProvider,
  getOpenRouterPdfEngine,
  getPdfModel,
  getProviderApiKey,
  getProviderBaseUrl
} from "@/lib/server/config";
import {
  looksLikePoorPdfExtraction,
  normalizeWhitespace,
  repairBrokenPdfText,
  trimAcademicFrontMatter
} from "@/lib/server/utils";

type CompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
      annotations?: Array<{
        type?: string;
        file?: {
          content?: Array<
            | {
                type?: "text";
                text?: string;
              }
            | {
                type?: "image_url";
                image_url?: { url?: string };
              }
          >;
        };
      }>;
    };
  }>;
};

function resolveMessageContent(content: unknown) {
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

function extractTextFromAnnotations(payload: CompletionResponse) {
  const isTextPart = (
    part:
      | {
          type?: "text";
          text?: string;
        }
      | {
          type?: "image_url";
          image_url?: { url?: string };
        }
  ): part is { type?: "text"; text?: string } => part.type === "text";

  const annotations = payload.choices?.[0]?.message?.annotations ?? [];
  const textParts = annotations
    .flatMap((annotation) => (annotation.type === "file" ? annotation.file?.content ?? [] : []))
    .filter(isTextPart)
    .map((part) => part.text ?? "")
    .join("\n\n");

  return normalizeWhitespace(textParts);
}

async function uploadDashScopeFile(buffer: Buffer, fileName: string) {
  const apiKey = getProviderApiKey("dashscope");

  if (!apiKey) {
    throw new Error("PDF 文本提取不足，且未配置 DASHSCOPE_API_KEY，无法继续走 DashScope 文档解析。");
  }

  const formData = new FormData();
  formData.append("purpose", "file-extract");
  formData.append(
    "file",
    new File([new Uint8Array(buffer)], fileName, { type: "application/pdf" })
  );

  const response = await fetch(`${getProviderBaseUrl("dashscope")}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`DashScope 文件上传失败：${payload}`);
  }

  const payload = (await response.json()) as { id?: string };

  if (!payload.id) {
    throw new Error("DashScope 文件上传后未返回 file id。");
  }

  return payload.id;
}

async function deleteDashScopeFile(fileId: string) {
  const apiKey = getProviderApiKey("dashscope");

  if (!apiKey) {
    return;
  }

  await fetch(`${getProviderBaseUrl("dashscope")}/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }).catch(() => undefined);
}

async function runDashScopePdfParser(buffer: Buffer, fileName: string) {
  const apiKey = getProviderApiKey("dashscope");

  if (!apiKey) {
    throw new Error("PDF 文本提取不足，且未配置 DASHSCOPE_API_KEY，无法继续走 DashScope 文档解析。");
  }

  const fileId = await uploadDashScopeFile(buffer, fileName);

  try {
    const response = await fetch(`${getProviderBaseUrl("dashscope")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getPdfModel("dashscope"),
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "你是一个文档提取助手。"
          },
          {
            role: "system",
            content: `fileid://${fileId}`
          },
          {
            role: "user",
            content:
              "请完整提取这份 PDF 的正文文本，尽量保留标题层级、段落顺序、表格文字和图注。不要总结，不要解释，不要补充，只输出提取后的纯文本。"
          }
        ]
      })
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`DashScope PDF 解析失败：${payload}`);
    }

    const payload = (await response.json()) as CompletionResponse;
    const parsedText = normalizeWhitespace(resolveMessageContent(payload.choices?.[0]?.message?.content));

    if (!parsedText) {
      throw new Error("DashScope PDF 解析没有返回可用文本。");
    }

    return parsedText;
  } finally {
    await deleteDashScopeFile(fileId);
  }
}

async function runOpenRouterPdfParser(buffer: Buffer, fileName: string) {
  const apiKey = getProviderApiKey("openrouter");

  if (!apiKey) {
    throw new Error("PDF 文本提取不足，且未配置 OPENROUTER_API_KEY，无法继续走 OpenRouter PDF OCR。");
  }

  const documentUrl = `data:application/pdf;base64,${buffer.toString("base64")}`;
  const response = await fetch(`${getProviderBaseUrl("openrouter")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_BASE_URL ?? "http://localhost:3000",
      "X-Title": "Paper Focus"
    },
    body: JSON.stringify({
      model: getPdfModel("openrouter"),
      temperature: 0,
      stream: false,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract the PDF content. Preserve paragraph boundaries and headings when possible. Return the document text only."
            },
            {
              type: "file",
              file: {
                filename: fileName,
                file_data: documentUrl
              }
            }
          ]
        }
      ],
      plugins: [
        {
          id: "file-parser",
          pdf: {
            engine: getOpenRouterPdfEngine()
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`OpenRouter PDF 解析失败：${payload}`);
  }

  const payload = (await response.json()) as CompletionResponse;
  const parsedText = extractTextFromAnnotations(payload);

  if (parsedText) {
    return parsedText;
  }

  const fallbackText = normalizeWhitespace(resolveMessageContent(payload.choices?.[0]?.message?.content));

  if (!fallbackText) {
    throw new Error("OpenRouter PDF 解析没有返回可用文本。");
  }

  return fallbackText;
}

export async function extractPdfContent(filePath: string) {
  const buffer = await readFile(filePath);
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = "default" in pdfParseModule ? pdfParseModule.default : pdfParseModule;
  const parsed = await pdfParse(buffer);
  const rawDirectText = normalizeWhitespace(parsed.text ?? "");
  const repairedDirectText = trimAcademicFrontMatter(repairBrokenPdfText(rawDirectText));
  const shouldUseDirectText =
    repairedDirectText.length >= PDF_DIRECT_TEXT_THRESHOLD && !looksLikePoorPdfExtraction(rawDirectText);

  if (shouldUseDirectText) {
    return {
      title: undefined,
      fullText: repairedDirectText,
      extractedText: rawDirectText,
      extractionMetadata: {
        pages: parsed.numpages ?? 0,
        extractionStrategy: "direct",
        extractionQuality: "accepted"
      }
    };
  }

  const provider = getLlmProvider();
  const providerApiKey = getProviderApiKey(provider);

  if (!providerApiKey) {
    return {
      title: undefined,
      fullText: repairedDirectText,
      extractedText: rawDirectText,
      extractionMetadata: {
        pages: parsed.numpages ?? 0,
        extractionStrategy: "direct_repaired_fallback",
        extractionQuality:
          rawDirectText.length < PDF_DIRECT_TEXT_THRESHOLD ? "too_short_without_provider" : "poor_quality_without_provider"
      }
    };
  }

  const ocrText =
    provider === "dashscope"
      ? await runDashScopePdfParser(buffer, filePath.split("/").pop() ?? "document.pdf")
      : await runOpenRouterPdfParser(buffer, filePath.split("/").pop() ?? "document.pdf");
  return {
    title: undefined,
    fullText: trimAcademicFrontMatter(ocrText),
    extractedText: rawDirectText,
    extractionMetadata: {
      pages: parsed.numpages ?? 0,
      extractionQuality:
        rawDirectText.length < PDF_DIRECT_TEXT_THRESHOLD ? "too_short" : "poor_quality",
      extractionStrategy:
        provider === "dashscope"
          ? `dashscope:${getPdfModel("dashscope")}`
          : `openrouter:${getOpenRouterPdfEngine()}`
    }
  };
}
