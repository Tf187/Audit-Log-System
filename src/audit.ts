import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

export const auditInputSchema = z.object({
  actorId: z.string().min(1),
  action: z.string().min(1).max(120),
  resourceType: z.string().min(1).max(120),
  resourceId: z.string().min(1),
  ip: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type AuditInput = z.infer<typeof auditInputSchema>;

export type AuditEntry = AuditInput & {
  id: string;
  timestamp: string;
  previousHash: string;
  hash: string;
};

function stablePayload(value: Omit<AuditEntry, "hash">) {
  return JSON.stringify(value);
}

export function createEntry(input: AuditInput, previousHash = "GENESIS"): AuditEntry {
  const unsigned = {
    ...input,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    previousHash
  };

  const hash = createHash("sha256").update(stablePayload(unsigned)).digest("hex");
  return { ...unsigned, hash };
}

export function verifyEntry(entry: AuditEntry): boolean {
  const { hash, ...unsigned } = entry;
  const expected = createHash("sha256").update(stablePayload(unsigned)).digest("hex");
  return expected === hash;
}
