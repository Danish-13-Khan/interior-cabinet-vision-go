/** Canvas appearance for the drafting studio. Calm Light has one appearance; the old "dark-frame" reads as light. */

export type DraftingAppearance = "light";

export const DRAFTING_APPEARANCE_STORAGE_KEY = "cabinet-designer-drafting-appearance";

export const DRAFTING_APPEARANCES = ["light"] as const;

export const DRAFTING_APPEARANCE_LABELS: Record<DraftingAppearance, string> = {
  light: "Light studio",
};

export function clampDraftingAppearance(_value: unknown): DraftingAppearance {
  return "light";
}

export function draftingAppearanceLabel(appearance: DraftingAppearance): string {
  return DRAFTING_APPEARANCE_LABELS[appearance];
}

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
