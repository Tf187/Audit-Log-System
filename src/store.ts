import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AuditEntry } from "./audit.js";

export class AuditStore {
  constructor(private readonly file: string) {}

  async list(): Promise<AuditEntry[]> {
    try {
      const raw = await readFile(this.file, "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as AuditEntry);
    } catch (error: any) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async lastHash(): Promise<string> {
    const entries = await this.list();
    return entries.at(-1)?.hash ?? "GENESIS";
  }

  async append(entry: AuditEntry): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await appendFile(this.file, JSON.stringify(entry) + "\n", "utf8");
  }
}
