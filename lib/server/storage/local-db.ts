import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DatabaseSchema, type Database } from "@/lib/types";

const DB_FILE_PATH = join(process.cwd(), "data", "papers.json");
const DB_TEMP_PATH = join(process.cwd(), "data", "papers.tmp.json");
const DB_BACKUP_PATH = join(process.cwd(), "data", "papers.backup.json");

let writeChain = Promise.resolve();

function buildEmptyDatabase(): Database {
  return {
    papers: [],
    comparisons: []
  };
}

function parseDatabase(raw: string) {
  return DatabaseSchema.parse(JSON.parse(raw));
}

async function ensureDbFile() {
  await mkdir(dirname(DB_FILE_PATH), { recursive: true });

  try {
    await readFile(DB_FILE_PATH, "utf8");
  } catch {
    const initial = JSON.stringify(buildEmptyDatabase(), null, 2);
    await writeFile(DB_FILE_PATH, initial);
    await writeFile(DB_BACKUP_PATH, initial);
  }
}

export async function readDatabase() {
  await ensureDbFile();
  const raw = await readFile(DB_FILE_PATH, "utf8");

  try {
    return parseDatabase(raw);
  } catch (primaryError) {
    try {
      const backupRaw = await readFile(DB_BACKUP_PATH, "utf8");
      const restored = parseDatabase(backupRaw);
      await writeFile(DB_FILE_PATH, backupRaw);
      return restored;
    } catch {
      throw new Error(
        `本地数据文件已损坏，且无法从备份恢复：${
          primaryError instanceof Error ? primaryError.message : String(primaryError)
        }`
      );
    }
  }
}

export async function mutateDatabase<T>(mutator: (database: Database) => Promise<T> | T) {
  const job = writeChain.then(async () => {
    const database = await readDatabase();
    const result = await mutator(database);
    const serialized = JSON.stringify(database, null, 2);

    // Write to a temp file first, then atomically replace the main DB file.
    // This prevents readers from seeing half-written JSON during async processing.
    await writeFile(DB_TEMP_PATH, serialized);
    await writeFile(DB_BACKUP_PATH, serialized);
    await rename(DB_TEMP_PATH, DB_FILE_PATH);
    return result;
  });

  writeChain = job.then(
    () => undefined,
    () => undefined
  );

  return job;
}
