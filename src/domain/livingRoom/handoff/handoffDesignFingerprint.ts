import type { CabinetProject } from "../../cabinetDimensions";
import { listCurrentProjectCabinets } from "../../cabinetIdentity";
import { hashString, stableStringify } from "../sceneCompilerBounds";

export function createHandoffDesignFingerprint(project: CabinetProject): string {
  const cabinets = listCurrentProjectCabinets(project)
    .map((cabinet) => ({
      id: cabinet.id,
      interiorObjectId: cabinet.interiorObjectId ?? "",
      name: cabinet.name,
      type: cabinet.config.type,
      family: cabinet.config.familyId ?? "",
      catalog: cabinet.config.catalogItemId ?? "",
      sku: cabinet.config.sku ?? "",
      dims: cabinet.config.dimensions,
      placement: cabinet.placement,
      composition: cabinet.config.composition ?? null,
      construction: cabinet.config.construction ?? null,
      hardware: cabinet.config.hardware ?? null,
      buildRules: cabinet.config.buildRules ?? {},
      shelves: cabinet.config.shelfCount,
      doors: cabinet.config.hasDoors,
      drawers: cabinet.config.drawerCount ?? 0,
      toe: [cabinet.config.toeKickHeight, cabinet.config.toeKickInset],
      ends: [cabinet.config.leftEndPanel ?? false, cabinet.config.rightEndPanel ?? false],
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return hashString(stableStringify({ cabinets }));
}
