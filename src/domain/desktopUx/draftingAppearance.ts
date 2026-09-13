/** Canvas appearance for the open-plan drafting studio (UI redesign A/B). */

export type DraftingAppearance = "light" | "dark-frame";

export const DRAFTING_APPEARANCE_STORAGE_KEY = "cabinet-designer-drafting-appearance";

export const DRAFTING_APPEARANCES = ["light", "dark-frame"] as const;

export const DRAFTING_APPEARANCE_LABELS: Record<DraftingAppearance, string> = {
  light: "Light studio",
  "dark-frame": "Dark frame",
};

export function clampDraftingAppearance(value: unknown): DraftingAppearance {
  return value === "dark-frame" ? "dark-frame" : "light";
}

export function draftingAppearanceLabel(appearance: DraftingAppearance): string {
  return DRAFTING_APPEARANCE_LABELS[appearance];
}

/** Both themes keep the plan surface light; only chrome density/frame changes. */
export function draftingSurfaceStaysLight(_appearance: DraftingAppearance): boolean {
  return true;
}

export function readDraftingAppearance(
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined"
    ? null
    : window.localStorage,
): DraftingAppearance {
  try {
    return clampDraftingAppearance(storage?.getItem(DRAFTING_APPEARANCE_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function persistDraftingAppearance(
  appearance: DraftingAppearance,
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined"
    ? null
    : window.localStorage,
): void {
  try {
    storage?.setItem(DRAFTING_APPEARANCE_STORAGE_KEY, clampDraftingAppearance(appearance));
  } catch {
    // Private mode may reject localStorage; in-memory preference still applies.
  }
}
