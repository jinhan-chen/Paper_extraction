import { NextResponse } from "next/server";
import { createPaperFromUpload } from "@/lib/server/services/paper-processing";
import { enqueuePaperProcessing } from "@/lib/server/services/processing-queue";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 PDF 文件。" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "目前只支持 PDF 文件。" }, { status: 400 });
  }

  const paper = await createPaperFromUpload(file);
  enqueuePaperProcessing(paper.id);

  return NextResponse.json({ paperId: paper.id, status: paper.status }, { status: 202 });
}
