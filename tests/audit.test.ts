import { describe, expect, it } from "vitest";
import { createEntry, verifyEntry } from "../src/audit.js";

describe("audit hash chain", () => {
  it("verifies an untouched entry", () => {
    const entry = createEntry({
      actorId: "user-42",
      action: "document.updated",
      resourceType: "document",
      resourceId: "doc-7"
    });

    expect(verifyEntry(entry)).toBe(true);
  });

  it("detects a modified entry", () => {
    const entry = createEntry({
      actorId: "user-42",
      action: "document.updated",
      resourceType: "document",
      resourceId: "doc-7"
    });

    const tampered = { ...entry, action: "document.deleted" };
    expect(verifyEntry(tampered)).toBe(false);
  });
});
