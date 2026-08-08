import type { CabinetConfig } from "../cabinetDimensions";
import type { CabinetType } from "../cabinetCapabilities";
import {
  supportsDoors,
  supportsShelves,
} from "../cabinetCapabilities";
import type { DoorStyle, OpeningStructure } from "../cabinetOpeningStructure";
import {
  migrateLegacyOpeningsToStructure,
  normalizeOpeningStructure,
} from "../cabinetOpeningStructure";
import type { CabinetComposition } from "./types";

export function doorCountForStyle(style: DoorStyle, widthMm: number): number {
  if (style === "none") return 0;
  if (style === "single") return 1;
  if (style === "bi-fold") return 2;
  return widthMm < 600 ? 1 : 2;
}

export function resolveStructureForComposition(
  type: CabinetType,
  composition: Partial<CabinetComposition> | undefined,
  seed: Partial<CabinetConfig> | undefined,
  widthMm: number,
): OpeningStructure {
  if (composition?.openingStructure) {
    return normalizeOpeningStructure(type, composition.openingStructure, widthMm);
  }

  return normalizeOpeningStructure(
    type,
    migrateLegacyOpeningsToStructure(
      type,
      widthMm,
      composition?.openings?.[0]?.style,
      seed?.shelfCount ?? composition?.shelves?.count ?? (supportsShelves(type) ? 1 : 0),
      seed?.drawerCount ?? composition?.drawers?.count ?? (type === "drawer" ? 3 : 0),
      seed?.hasDoors ?? composition?.doors?.enabled ?? supportsDoors(type),
    ),
    widthMm,
  );
}
