import { describe, expect, it } from "vitest";
import { DEFAULT_DRAFTING_DISPLAY } from "../draftingAnnotations";
import {
  displayPrefsForMode,
  normalizePaneDisplayMode,
} from "./paneDisplayMode";

describe("paneDisplayMode", () => {
  it("normalizes unknown modes to working", () => {
    expect(normalizePaneDisplayMode("working")).toBe("working");
    expect(normalizePaneDisplayMode("dims")).toBe("dims");
    expect(normalizePaneDisplayMode("clean")).toBe("clean");
    expect(normalizePaneDisplayMode("nope")).toBe("working");
  });

  it("keeps working mode as the base prefs", () => {
    expect(displayPrefsForMode("working", DEFAULT_DRAFTING_DISPLAY)).toEqual(
      DEFAULT_DRAFTING_DISPLAY,
    );
  });

  it("dims mode keeps chains and drops tags/runs", () => {
    const prefs = displayPrefsForMode("dims", DEFAULT_DRAFTING_DISPLAY);
    expect(prefs.showDimensionChains).toBe(true);
    expect(prefs.showCabinetTags).toBe(false);
    expect(prefs.showRunBands).toBe(false);
    expect(prefs.showRunLabels).toBe(false);
  });

  it("clean mode drops dimensions and construction overlays", () => {
    const prefs = displayPrefsForMode("clean", DEFAULT_DRAFTING_DISPLAY);
    expect(prefs.showDimensionChains).toBe(false);
    expect(prefs.showFillers).toBe(false);
    expect(prefs.showCountertopSpans).toBe(false);
    expect(prefs.showCabinetTags).toBe(true);
  });
});
