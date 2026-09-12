import { describe, expect, it } from "vitest";
import {
  clampDraftingAppearance,
  draftingAppearanceLabel,
  draftingSurfaceStaysLight,
  persistDraftingAppearance,
  readDraftingAppearance,
} from "./draftingAppearance";

describe("draftingAppearance (Phase E)", () => {
  it("defaults to light studio and keeps the plan surface light", () => {
    expect(clampDraftingAppearance("dark-frame")).toBe("dark-frame");
    expect(clampDraftingAppearance("nope")).toBe("light");
    expect(draftingAppearanceLabel("light")).toBe("Light studio");
    expect(draftingSurfaceStaysLight("dark-frame")).toBe(true);
  });

  it("round-trips through a storage stub", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
    };
    expect(readDraftingAppearance(storage)).toBe("light");
    persistDraftingAppearance("dark-frame", storage);
    expect(readDraftingAppearance(storage)).toBe("dark-frame");
  });
});
