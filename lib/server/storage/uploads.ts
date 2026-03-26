import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createId } from "@/lib/server/utils";

const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

export async function saveUploadedPdf(file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const extension = extname(file.name) || ".pdf";
  const fileName = `${createId("upload")}${extension}`;
  const filePath = join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    fileName: file.name,
    filePath
  };
}
