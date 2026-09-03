import type { CatalogLifecycle, CatalogPlacement, MaterialSlotPolicy } from "../types";
import overridesData from "./overrides.data.json";

export type KenneyItemOverride = {
  stem: string;
  name?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  placement?: CatalogPlacement;
  dimensionsMm?: { width: number; height: number; depth: number };
  lifecycle?: CatalogLifecycle;
  visibility?: { objectBrowser: boolean; templateEligible: boolean };
  materialSlots?: Record<string, MaterialSlotPolicy>;
  thumbnailAngle?: "NE" | "NW" | "SE" | "SW";
};

/** Human curation for Kenney stems. Generator merges this over discovered metadata. */
export const KENNEY_OVERRIDES = overridesData as KenneyItemOverride[];

const byStem = new Map(KENNEY_OVERRIDES.map((entry) => [entry.stem, entry]));

export function getKenneyOverride(stem: string): KenneyItemOverride | undefined {
  return byStem.get(stem);
}
