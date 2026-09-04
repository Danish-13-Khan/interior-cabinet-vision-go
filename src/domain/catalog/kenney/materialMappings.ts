import type { MaterialSlotPolicy } from "../types";
import proofSlots from "./proofMaterialSlots.data.json";
import curatedSlotsA from "./curatedSlotsA.data.json";
import curatedSlotsB from "./curatedSlotsB.data.json";
import curatedSlotsC from "./curatedSlotsC.data.json";

/** Phase 2 proof-asset stems with reviewed Kenney material → semantic slot maps. */
export const KENNEY_PROOF_STEMS = [
  "loungeSofa",
  "bedDouble",
  "tableCoffeeGlass",
  "bathroomMirror",
  "shower",
  "kitchenFridge",
  "televisionModern",
  "pottedPlant",
] as const;

export type KenneyProofStem = (typeof KENNEY_PROOF_STEMS)[number];

export const KENNEY_PROOF_MATERIAL_SLOTS = proofSlots as Record<
  KenneyProofStem,
  Record<string, MaterialSlotPolicy>
>;

/** Phase 3 curated slots merged with Phase 2 proof maps (proof wins on key clash). */
export const KENNEY_MATERIAL_SLOTS = {
  ...curatedSlotsA,
  ...curatedSlotsB,
  ...curatedSlotsC,
  ...KENNEY_PROOF_MATERIAL_SLOTS,
} as Record<string, Record<string, MaterialSlotPolicy>>;

export function getProofMaterialSlots(
  stem: string,
): Record<string, MaterialSlotPolicy> | undefined {
  return KENNEY_MATERIAL_SLOTS[stem];
}
