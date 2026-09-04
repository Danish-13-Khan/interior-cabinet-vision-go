import type { CatalogLifecycle, CatalogPlacement, MaterialSlotPolicy } from "../types";
import architectureOverrides from "./overrides.data.json";
import cabinetPropOverrides from "./cabinetPropOverrides.data.json";
import curatedBedroom from "./curatedBedroom.data.json";
import curatedKitchenBathroom from "./curatedKitchenBathroom.data.json";
import curatedLiving from "./curatedLiving.data.json";
import curatedOfficeUtility from "./curatedOfficeUtility.data.json";

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
export const KENNEY_OVERRIDES = [
  ...architectureOverrides,
  ...cabinetPropOverrides,
  ...curatedLiving,
  ...curatedBedroom,
  ...curatedKitchenBathroom,
  ...curatedOfficeUtility,
] as KenneyItemOverride[];

const byStem = new Map(KENNEY_OVERRIDES.map((entry) => [entry.stem, entry]));

export function getKenneyOverride(stem: string): KenneyItemOverride | undefined {
  return byStem.get(stem);
}
