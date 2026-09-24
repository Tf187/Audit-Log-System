import express from "express";
import { auditInputSchema, createEntry, verifyEntry } from "./audit.js";
import { AuditStore } from "./store.js";

const port = Number(process.env.PORT ?? 8090);
const apiKey = process.env.API_KEY ?? "change-me";
const store = new AuditStore(process.env.AUDIT_FILE ?? "./data/audit.ndjson");

const app = express();
app.use(express.json());

function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header("x-api-key") !== apiKey) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/audit", requireApiKey, async (req, res) => {
  const parsed = auditInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_audit_event", details: parsed.error.flatten() });
    return;
  }

  const entry = createEntry(parsed.data, await store.lastHash());
  await store.append(entry);
  res.status(201).json(entry);
});

app.get("/audit", requireApiKey, async (req, res) => {
  const actorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const resourceId = typeof req.query.resourceId === "string" ? req.query.resourceId : undefined;

  const entries = (await store.list()).filter((entry) =>
    (!actorId || entry.actorId === actorId) &&
    (!action || entry.action === action) &&
    (!resourceId || entry.resourceId === resourceId)
  );

  res.json({ count: entries.length, entries });
});

app.get("/audit/verify", requireApiKey, async (_req, res) => {
  const entries = await store.list();
  let previousHash = "GENESIS";

  for (const entry of entries) {
    if (!verifyEntry(entry) || entry.previousHash !== previousHash) {
      res.status(409).json({ valid: false, failedEntryId: entry.id });
      return;
    }
    previousHash = entry.hash;
  }

  res.json({ valid: true, entries: entries.length });
});

app.listen(port, () => {
  console.log(`audit log server listening on :${port}`);
});
