import type { MaterialSlotPolicy } from "../types";
import proofSlots from "./proofMaterialSlots.data.json";

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

export function getProofMaterialSlots(
  stem: string,
): Record<string, MaterialSlotPolicy> | undefined {
  if (!(stem in KENNEY_PROOF_MATERIAL_SLOTS)) return undefined;
  return KENNEY_PROOF_MATERIAL_SLOTS[stem as KenneyProofStem];
}
