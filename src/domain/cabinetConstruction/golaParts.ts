import type { CabinetConfig } from "../cabinetDimensions";
import { resolveFrontGaps } from "./frontGaps";
import type { CabinetPart } from "./types";

const SIDE_PART_IDS = new Set(["left-side", "right-side"]);
const mm = (value: number) => `${Math.round(value * 10) / 10}`;

/** Gola profiles need a notch in the carcass sides; cut-list outlines stay rectangular, so it travels as a note. */
export function golaNotchNote(config: CabinetConfig): string | null {
  const { profiles } = resolveFrontGaps(config);
  if (!profiles.length) return null;
  const toeKick = config.toeKickHeight;
  const notches = profiles.map((band) => {
    const from = toeKick + band.yMm;
    return `${band.kind} ${mm(band.heightMm)}×${mm(band.depthMm)} mm from ${mm(from)} to ${mm(from + band.heightMm)} mm`;
  });
  return `Gola notch: ${[...new Set(notches)].join("; ")} (heights from the side's bottom edge, depth from its front edge)`;
}

export function appendGolaNotchNotes(parts: CabinetPart[], config: CabinetConfig): void {
  const note = golaNotchNote(config);
  if (!note) return;
  for (const part of parts) {
    if (!SIDE_PART_IDS.has(part.id)) continue;
    part.notes = part.notes ? `${part.notes}; ${note}` : note;
  }
}
