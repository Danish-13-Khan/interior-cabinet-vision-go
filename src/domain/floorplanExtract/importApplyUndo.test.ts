import { describe, expect, it } from "vitest";
import { captureImportUndoHead, importApplyUndoVisible } from "./importApplyUndo";

describe("importApplyUndoVisible", () => {
  it("stays hidden until an in-session Apply arms it", () => {
    expect(importApplyUndoVisible({
      armed: false,
      importHeadAt: "t1",
      projectUpdatedAt: "t1",
      hasAppliedExtract: true,
    })).toBe(false);
  });

  it("shows while the import is still the current history head", () => {
    expect(importApplyUndoVisible({
      armed: true,
      importHeadAt: "t1",
      projectUpdatedAt: "t1",
      hasAppliedExtract: true,
    })).toBe(true);
  });

  it("hides after a later edit changes the history head", () => {
    expect(importApplyUndoVisible({
      armed: true,
      importHeadAt: "t1",
      projectUpdatedAt: "t2",
      hasAppliedExtract: true,
    })).toBe(false);
  });

  it("hides when toolbar Undo drops the applied extract", () => {
    expect(importApplyUndoVisible({
      armed: true,
      importHeadAt: "t1",
      projectUpdatedAt: "t0",
      hasAppliedExtract: false,
    })).toBe(false);
    expect(captureImportUndoHead({ updatedAt: "t0", extensions: {} })).toBeNull();
  });
});
