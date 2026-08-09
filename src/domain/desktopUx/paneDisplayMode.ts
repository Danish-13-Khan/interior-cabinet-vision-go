import {
  clampDraftingDisplay,
  type DraftingDisplayPreferences,
} from "../draftingAnnotations";

export type PaneDisplayMode = "working" | "dims" | "clean";

export const PANE_DISPLAY_MODES: readonly PaneDisplayMode[] = [
  "working",
  "dims",
  "clean",
] as const;

export const PANE_DISPLAY_MODE_LABELS: Record<PaneDisplayMode, string> = {
  working: "Working",
  dims: "Dims",
  clean: "Clean",
};

export function normalizePaneDisplayMode(value: unknown): PaneDisplayMode {
  if (value === "dims" || value === "clean" || value === "working") return value;
  return "working";
}

/** Overlay display preferences for a pane-local display mode. */
export function displayPrefsForMode(
  mode: PaneDisplayMode,
  base: DraftingDisplayPreferences,
): DraftingDisplayPreferences {
  const safe = clampDraftingDisplay(base);
  if (mode === "working") return safe;
  if (mode === "dims") {
    return clampDraftingDisplay({
      ...safe,
      showCabinetTags: false,
      showOpeningTags: false,
      showApplianceTags: false,
      showRunBands: false,
      showRunLabels: false,
      showDimensionChains: true,
      showOverallDims: true,
      showSelectedDims: true,
      showOpeningDims: true,
      showRunDims: true,
      showClearanceDims: true,
      showWallLabels: true,
      showFillers: true,
      showCountertopSpans: false,
    });
  }
  return clampDraftingDisplay({
    ...safe,
    showCabinetTags: true,
    showOpeningTags: false,
    showApplianceTags: false,
    showDimensionChains: false,
    showOverallDims: false,
    showSelectedDims: false,
    showOpeningDims: false,
    showRunDims: false,
    showClearanceDims: false,
    showWallLabels: true,
    showRunBands: false,
    showRunLabels: false,
    showFillers: false,
    showCountertopSpans: false,
  });
}
