import { describe, expect, it } from "vitest";
import {
  looksLikePoorPdfExtraction,
  repairBrokenPdfText,
  trimAcademicFrontMatter
} from "@/lib/server/utils";

describe("pdf cleaning helpers", () => {
  it("repairs broken line-wrapped pdf text", () => {
    const repaired = repairBrokenPdfText("计\n算\n机\n系\n统\n\n摘\n要\n\n动\n态\n优\n化");

    expect(repaired).toContain("计算机系统");
    expect(repaired).toContain("摘要");
    expect(repaired).toContain("动态优化");
  });

  it("trims academic front matter when abstract marker exists", () => {
    const trimmed = trimAcademicFrontMatter(
      "书书书 第35卷 第7期 收稿日期 2012-05-03 作者简介略略略 摘要 本文综述动态优化模型，并讨论求解与应用。"
    );

    expect(trimmed.startsWith("摘要")).toBe(true);
    expect(trimmed).toContain("本文综述动态优化模型");
  });

  it("detects poor direct pdf extraction quality", () => {
    const broken = "书\n书\n书\n第\n３５\n卷\n计\n算\n机\n学\n报\n摘\n要\n动\n态\n优\n化\n模\n型";

    expect(looksLikePoorPdfExtraction(broken)).toBe(true);
    expect(
      looksLikePoorPdfExtraction("摘要 本文综述动态优化理论在计算机系统与网络中的建模、求解与应用。")
    ).toBe(false);
  });
});
