import { describe, expect, it } from "vitest";
import { confirmDiscardUnsaved, DISCARD_UNSAVED_MESSAGE } from "./confirmDiscardUnsaved";

describe("unsaved open check", () => {
  it("asks only when the open project is dirty", async () => {
    await expect(confirmDiscardUnsaved(false, () => false)).resolves.toBe(true);
    await expect(confirmDiscardUnsaved(true, (message) => message === DISCARD_UNSAVED_MESSAGE)).resolves.toBe(true);
    await expect(confirmDiscardUnsaved(true, () => false)).resolves.toBe(false);
  });

  it("waits for an async dialog instead of treating its Promise as yes", async () => {
    await expect(confirmDiscardUnsaved(true, async () => false)).resolves.toBe(false);
    await expect(confirmDiscardUnsaved(true, async () => true)).resolves.toBe(true);
  });
});
