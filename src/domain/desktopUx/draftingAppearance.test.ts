import { describe, expect, it } from "vitest";
import {
  clampDraftingAppearance,
  DRAFTING_APPEARANCES,
  draftingAppearanceLabel,
  draftingSurfaceStaysLight,
  persistDraftingAppearance,
  readDraftingAppearance,
} from "./draftingAppearance";

describe("draftingAppearance (Calm Light)", () => {
  it("has a single light appearance; retired dark-frame reads as light", () => {
    expect(DRAFTING_APPEARANCES).toEqual(["light"]);
    expect(clampDraftingAppearance("dark-frame")).toBe("light");
    expect(clampDraftingAppearance("nope")).toBe("light");
    expect(draftingAppearanceLabel("light")).toBe("Light studio");
    expect(draftingSurfaceStaysLight("light")).toBe(true);
  });

  it("migrates a stored dark-frame preference to light", () => {
    const store = new Map<string, string>([["cabinet-designer-drafting-appearance", "dark-frame"]]);
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
    };
    expect(readDraftingAppearance(storage)).toBe("light");
    persistDraftingAppearance("light", storage);
    expect(store.get("cabinet-designer-drafting-appearance")).toBe("light");
  });
});
