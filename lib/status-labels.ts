import type { ComparisonStatus, PaperStatus, SummaryStatus } from "@/lib/types";

const paperStatusLabels: Record<PaperStatus, string> = {
  queued: "排队中",
  extracting: "提取正文中",
  summarizing: "生成总结中",
  ready: "已完成",
  failed: "失败"
};

const summaryStatusLabels: Record<SummaryStatus, string> = {
  idle: "未开始",
  queued: "排队中",
  generating: "生成中",
  ready: "已完成",
  failed: "失败"
};

const comparisonStatusLabels: Record<ComparisonStatus, string> = {
  queued: "排队中",
  analyzing: "生成综述中",
  ready: "已完成",
  failed: "失败"
};

export function getPaperStatusLabel(status: PaperStatus) {
  return paperStatusLabels[status];
}

export function getSummaryStatusLabel(status: SummaryStatus) {
  return summaryStatusLabels[status];
}

export function getComparisonStatusLabel(status: ComparisonStatus) {
  return comparisonStatusLabels[status];
}
