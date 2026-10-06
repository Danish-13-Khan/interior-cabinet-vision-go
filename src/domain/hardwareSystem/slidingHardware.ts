import type { CabinetConfig } from "../cabinetDimensions";
import { slidingLeaves } from "../cabinetConstruction/slidingFronts";
import type { ResolvedFronts } from "../cabinetConstruction/frontGaps";
import {
  SLIDING_DEFAULTS,
  SLIDING_PULL_ID,
  SLIDING_ROLLER_HARDWARE,
  SLIDING_TRACK_HARDWARE,
  type SlidingDoorSpec,
} from "../frontSystem/slidingDefaults";
import type { HardwareItem } from "./types";

/** D10: sliding lines stay flagged until a factory confirms the track (Q4). */
const unconfirmed = !SLIDING_DEFAULTS.confirmed;

/** Sliding wardrobe hardware (Phase 3, §3.4). Tracks are sold by the metre (length = wardrobe width). */
export const SLIDING_HARDWARE_ITEMS: readonly HardwareItem[] = [
  {
    id: SLIDING_TRACK_HARDWARE["bottom-roll"],
    label: "Sliding track set, bottom-roll double (per metre)",
    kind: "profile",
    costPerUnit: 950,
    description: "Aluminium double bottom track + top guide; cut to the wardrobe width",
    unconfirmedDefault: unconfirmed,
  },
  {
    id: SLIDING_TRACK_HARDWARE["top-hung"],
    label: "Sliding track set, top-hung double (per metre)",
    kind: "profile",
    costPerUnit: 1250,
    description: "Aluminium double top track + floor guide; cut to the wardrobe width",
    unconfirmedDefault: unconfirmed,
  },
  {
    id: SLIDING_ROLLER_HARDWARE["bottom-roll"],
    label: "Sliding roller set, bottom-roll (per leaf)",
    kind: "accessory",
    costPerUnit: 650,
    description: "Two bottom rollers + two top guides for one shutter",
    unconfirmedDefault: unconfirmed,
  },
  {
    id: SLIDING_ROLLER_HARDWARE["top-hung"],
    label: "Sliding roller set, top-hung (per leaf)",
    kind: "accessory",
    costPerUnit: 850,
    description: "Two top hangers + bottom guide for one shutter",
    unconfirmedDefault: unconfirmed,
  },
  {
    id: SLIDING_PULL_ID,
    label: "Flush pull for sliding shutter (per leaf)",
    kind: "accessory",
    costPerUnit: 160,
    description: "Recessed pull; a projecting handle would hit the leaf passing in front",
    unconfirmedDefault: unconfirmed,
  },
];

/**
 * Sliding schedule (§3.4): one track set per wardrobe (metres = W), one roller set and
 * one flush pull per leaf. Hinges are zeroed by the caller.
 */
export function slidingHardwareQuantities(
  config: CabinetConfig,
  spec: SlidingDoorSpec,
  fronts: ResolvedFronts,
): Array<[string, number]> {
  const leaves = slidingLeaves(fronts.openings).length;
  if (leaves === 0) return [];
  const metres = Math.round((config.dimensions.width / 1000) * 100) / 100;
  return [
    [SLIDING_TRACK_HARDWARE[spec.trackKind], metres],
    [SLIDING_ROLLER_HARDWARE[spec.trackKind], leaves],
    [SLIDING_PULL_ID, leaves],
  ];
}
