import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { inferTitleFromUrl, normalizeWhitespace } from "@/lib/server/utils";

export async function extractUrlContent(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PaperFocusBot/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`网页抓取失败：${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  const fullText = normalizeWhitespace(article?.textContent ?? "");

  if (fullText.length < 400) {
    throw new Error("网页正文过短或提取失败，无法生成可靠总结。");
  }

  return {
    title: article?.title?.trim() || inferTitleFromUrl(url),
    fullText,
    extractedText: fullText,
    extractionMetadata: {
      byline: article?.byline ?? null,
      excerpt: article?.excerpt ?? null,
      siteName: article?.siteName ?? null,
      extractionStrategy: "readability"
    }
  };
}
