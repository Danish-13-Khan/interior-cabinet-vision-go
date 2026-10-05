import type { CabinetConfig } from "../cabinetDimensions";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import type { CabinetCutlistItem } from "./types";

const KINDS = [
  { kind: "drawer", key: "drawer-fronts", label: "Drawer Front" },
  { kind: "door", key: "doors", label: "Door" },
] as const;

/** Door and drawer-front rows, grouped by size, from the shared front-gap resolver. */
export function frontCutlistItems(config: CabinetConfig): CabinetCutlistItem[] {
  const openings = resolveFrontGaps(config).openings;
  const items: CabinetCutlistItem[] = [];
  for (const { kind, key, label } of KINDS) {
    const groups = new Map<string, CabinetCutlistItem>();
    for (const leaf of openings.filter((entry) => entry.kind === kind).flatMap((entry) => entry.leaves)) {
      const lengthMm = Math.round(leaf.heightMm);
      const widthMm = Math.round(leaf.widthMm);
      const sizeKey = `${lengthMm}x${widthMm}`;
      const existing = groups.get(sizeKey);
      if (existing) {
        existing.quantity += 1;
        continue;
      }
      groups.set(sizeKey, {
        key: groups.size === 0 ? key : `${key}-${groups.size + 1}`,
        label,
        quantity: 1,
        lengthMm,
        widthMm,
        thicknessMm: config.dimensions.boardThickness,
        material: "Door",
      });
    }
    items.push(...groups.values());
  }
  return items;
}
