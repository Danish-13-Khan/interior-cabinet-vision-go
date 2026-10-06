import type { CabinetConfig } from "../cabinetDimensions";
import { getDoorMountLabel, normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { DOOR_PANEL_GROOVE_MM, doorFrameWidths } from "../frontSystem/doorStyles";
import type { ConstructionContext } from "./context";
import { doorPieces, type DoorPieceKind } from "./doorPieces";
import { resolveFrontGaps, type ResolvedOpeningFronts } from "./frontGaps";
import { createPart } from "./helpers";
import { SLIDING_OPENING_ID } from "./slidingFronts";

/**
 * Door parts. Slab and bought shaker / glass doors stay one part per opening (cut list unchanged);
 * in-house frames cut two stiles and two rails per leaf, plus a centre panel for shaker.
 * Glass is never a board part: it goes on the hardware list (`doorGlassSquareMetres`).
 */
export function appendDoorParts(ctx: ConstructionContext, doorOpenings: ResolvedOpeningFronts[]): void {
  const { buildRules, constructionSpec, materialSpec, parts } = ctx;
  const door = materialSpec.doorMaterial;
  const thickness = buildRules.carcassThicknessMm;
  const mount = `${getDoorMountLabel(constructionSpec.doorMount)} mount`;
  const style = constructionSpec.frontStyle;
  const part = (id: string, label: string, quantity: number, lengthMm: number, widthMm: number, thicknessMm: number, note: string) =>
    createPart(id, label, "Door", quantity, lengthMm, widthMm, thicknessMm, door.grainDirection,
      door.boardMaterialId.toUpperCase(), door.finishId, door.edgeBandingId, note);

  const kindLabel = style?.style === "glass" ? "Glass door" : "Shaker door";
  const notes: Record<DoorPieceKind, string> = {
    door: mount,
    stile: `${kindLabel} stile, full leaf height · ${mount}`,
    rail: `${kindLabel} rail, fits between the stiles`,
    panel: `Shaker centre panel, ${DOOR_PANEL_GROOVE_MM} mm into the frame groove each side`,
  };
  const sliding = constructionSpec.sliding;
  for (const { opening, leaves } of doorOpenings) {
    const suffix = doorOpenings.length === 1 ? "" : `-${opening.id}`;
    const slidingNote = sliding && opening.id === SLIDING_OPENING_ID
      ? `Sliding shutter · ${sliding.trackKind} track · ${sliding.overlapMm} mm overlap · ${leaves.length} leaves`
      : null;
    for (const piece of doorPieces(leaves[0]!, style, constructionSpec.faceFrame, thickness)) {
      const own = piece.kind === "door" ? "" : `-${piece.kind}`;
      const note = slidingNote && piece.kind === "door" ? slidingNote : notes[piece.kind];
      parts.push(part(`door${suffix}${own}`, piece.kind === "door" ? opening.label : `${opening.label} ${piece.kind}`,
        leaves.length * piece.perLeaf, piece.lengthMm, piece.widthMm, piece.thicknessMm, note));
    }
  }
}

/** Glass area for in-house glass doors (bought glass doors come glazed), rounded to 0.01 m². */
export function doorGlassSquareMetres(config: CabinetConfig): number {
  const spec = normalizeConstructionSpec(config.type, config.construction);
  if (spec.frontStyle?.style !== "glass" || spec.frontStyle.sourcing !== "in-house") return 0;
  const area = resolveFrontGaps(config).openings
    .filter((entry) => entry.kind === "door")
    .flatMap((entry) => entry.leaves)
    .reduce((sum, leaf) => {
      const { stileMm, railMm } = doorFrameWidths(leaf, spec.faceFrame);
      const width = leaf.widthMm - stileMm * 2 + DOOR_PANEL_GROOVE_MM * 2;
      const height = leaf.heightMm - railMm * 2 + DOOR_PANEL_GROOVE_MM * 2;
      return sum + (width * height) / 1_000_000;
    }, 0);
  return Math.round(area * 100) / 100;
}
