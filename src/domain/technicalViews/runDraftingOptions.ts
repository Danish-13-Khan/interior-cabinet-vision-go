import type { DraftingDisplayPreferences } from "../draftingAnnotations";
import type { RunDraftingOptions } from "../runDrafting";

export function runDraftingOptionsFromDisplay(
  display: DraftingDisplayPreferences,
): RunDraftingOptions {
  return {
    showRunBands: display.showRunBands,
    showRunLabels: display.showRunLabels,
    showFillers: display.showFillers,
    showCountertopSpans: display.showCountertopSpans,
    showDimensionChains: display.showDimensionChains,
    dimMinSegmentMm: display.dimMinSegmentMm,
  };
}
