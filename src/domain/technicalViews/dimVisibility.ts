import type { DraftingDisplayPreferences } from "../draftingAnnotations";
import type { DimKind } from "./dimGraphicsTypes";
import type { TechnicalViewKind } from "./types";

export type DimVisibility = Record<DimKind, boolean>;

/** Resolve which dimension kinds render for the current display prefs + view. */
export function resolveDimVisibility(
  display: DraftingDisplayPreferences,
  view: TechnicalViewKind,
): DimVisibility {
  const chains = display.showDimensionChains;
  const overall = display.showOverallDims;
  const selected = display.showSelectedDims;
  const opening = display.showOpeningDims;
  const run = display.showRunDims;
  const clearance = display.showClearanceDims;

  const elevLike = view === "front" || view === "side" || view === "section";
  const planLike = view === "top";

  return {
    overall,
    chain: chains && (planLike || elevLike) && view !== "section",
    run: run && chains && (planLike || elevLike),
    selected: selected && view !== "report" && view !== "detail",
    opening: opening && (view === "front" || view === "side"),
    clearance: clearance && elevLike,
  };
}

export function dimKindEnabled(
  visibility: DimVisibility,
  kind: DimKind,
): boolean {
  return Boolean(visibility[kind]);
}
