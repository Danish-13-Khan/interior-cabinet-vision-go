import type { CabinetConfig } from "../cabinetDimensions";
import { resolveCabinetBuildRules } from "../cabinetConstruction/buildRules";
import { doorPieces, type DoorPieceKind } from "../cabinetConstruction/doorPieces";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import type { CabinetCutlistItem } from "./types";

type Row = { key: string; label: string; lengthMm: number; widthMm: number; thicknessMm: number; quantity: number };

const DOOR_ROWS: Record<DoorPieceKind, { key: string; label: string }> = {
  door: { key: "doors", label: "Door" },
  stile: { key: "door-stiles", label: "Door Stile" },
  rail: { key: "door-rails", label: "Door Rail" },
  panel: { key: "door-panels", label: "Door Panel" },
};

/** Groups equal sizes under one row; the first group keeps the bare key. */
function groupRows(rows: Row[]): CabinetCutlistItem[] {
  const groups = new Map<string, CabinetCutlistItem>();
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const lengthMm = Math.round(row.lengthMm);
    const widthMm = Math.round(row.widthMm);
    const sizeKey = `${row.key}:${lengthMm}x${widthMm}x${row.thicknessMm}`;
    const existing = groups.get(sizeKey);
    if (existing) {
      existing.quantity += row.quantity;
      continue;
    }
    const count = (keyCounts.get(row.key) ?? 0) + 1;
    keyCounts.set(row.key, count);
    groups.set(sizeKey, {
      key: count === 1 ? row.key : `${row.key}-${count}`,
      label: row.label,
      quantity: row.quantity,
      lengthMm,
      widthMm,
      thicknessMm: row.thicknessMm,
      material: "Door",
    });
  }
  return [...groups.values()];
}

/**
 * Door and drawer-front rows from the shared front-gap resolver. Doors are cut with `doorPieces`, the
 * same rule production uses, so in-house shaker / glass frames list stiles, rails and panels here too.
 */
export function frontCutlistItems(config: CabinetConfig): CabinetCutlistItem[] {
  const openings = resolveFrontGaps(config).openings;
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const thickness = resolveCabinetBuildRules(config).carcassThicknessMm;
  const leavesOf = (kind: "door" | "drawer") => openings.filter((entry) => entry.kind === kind).flatMap((entry) => entry.leaves);
  const drawerRows = leavesOf("drawer").map((leaf): Row => ({
    key: "drawer-fronts", label: "Drawer Front", lengthMm: leaf.heightMm, widthMm: leaf.widthMm, thicknessMm: thickness, quantity: 1,
  }));
  const doorRows = leavesOf("door").flatMap((leaf) => doorPieces(leaf, spec.frontStyle, spec.faceFrame, thickness).map((piece): Row => ({
    ...DOOR_ROWS[piece.kind], lengthMm: piece.lengthMm, widthMm: piece.widthMm, thicknessMm: piece.thicknessMm, quantity: piece.perLeaf,
  })));
  return [...groupRows(drawerRows), ...groupRows(doorRows)];
}
