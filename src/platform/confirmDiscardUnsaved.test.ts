import { describe, expect, it } from "vitest";
import { confirmDiscardUnsaved, DISCARD_UNSAVED_MESSAGE } from "./confirmDiscardUnsaved";

describe("unsaved open check", () => {
  it("asks only when the open project is dirty", () => {
    expect(confirmDiscardUnsaved(false, () => false)).toBe(true);
    expect(confirmDiscardUnsaved(true, (message) => message === DISCARD_UNSAVED_MESSAGE)).toBe(true);
    expect(confirmDiscardUnsaved(true, () => false)).toBe(false);
  });
});
