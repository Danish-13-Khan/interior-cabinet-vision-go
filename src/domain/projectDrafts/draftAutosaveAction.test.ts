import { describe, expect, it } from "vitest";
import { draftAutosaveAction } from "./draftAutosaveAction";

const starter = "{\"project\":\"starter\"}";
const opened = "{\"project\":\"3bhk\"}";

describe("draft autosave", () => {
  it("keeps the document opened before autosave is on, then writes it once autosave starts", () => {
    expect(draftAutosaveAction({
      baseline: null, enabled: false, suspended: false, fingerprint: starter, canSave: true,
    })).toBe("adopt");
    expect(draftAutosaveAction({
      baseline: starter, enabled: false, suspended: false, fingerprint: opened, canSave: true,
    })).toBe("hold");
    expect(draftAutosaveAction({
      baseline: starter, enabled: true, suspended: false, fingerprint: opened, canSave: true,
    })).toBe("write");
  });

  it("does not schedule a save when a new object carries the same document", () => {
    expect(draftAutosaveAction({
      baseline: opened, enabled: true, suspended: false, fingerprint: opened, canSave: true,
    })).toBe("skip");
  });

  it("holds a change while writes are suspended, and skips a project that cannot be saved", () => {
    expect(draftAutosaveAction({
      baseline: starter, enabled: true, suspended: true, fingerprint: opened, canSave: true,
    })).toBe("hold");
    expect(draftAutosaveAction({
      baseline: starter, enabled: true, suspended: false, fingerprint: opened, canSave: false,
    })).toBe("skip");
  });
});
