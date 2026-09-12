import type { CabinetProject } from "../cabinetDimensions";
import { hashString } from "../livingRoom/sceneCompilerBounds";

/** JSON-stable: omitted keys match file reload, so a freeze survives save/open. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .filter((key) => object[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Design fingerprint for the cabinet-shell freeze path.
 * Covers everything that feeds the cutlist, so a design change marks an issued
 * quote stale even when the sell total happens to land on the same number.
 */
export function createCabinetDesignFingerprint(project: CabinetProject): string {
  return hashString(
    stableStringify({
      cabinets: project.cabinets
        .map((cabinet) => ({
          id: cabinet.id,
          name: cabinet.name,
          type: cabinet.config.type,
          family: cabinet.config.familyId ?? "",
          catalog: cabinet.config.catalogItemId ?? "",
          sku: cabinet.config.sku ?? "",
          dims: cabinet.config.dimensions,
          shelves: cabinet.config.shelfCount,
          doors: cabinet.config.hasDoors,
          drawers: cabinet.config.drawerCount ?? 0,
          toe: [cabinet.config.toeKickHeight, cabinet.config.toeKickInset],
          ends: [
            cabinet.config.leftEndPanel ?? false,
            cabinet.config.rightEndPanel ?? false,
          ],
          finish: cabinet.config.buildRules ?? {},
          composition: cabinet.config.composition ?? null,
          construction: cabinet.config.construction ?? null,
          hardware: cabinet.config.hardware ?? null,
          placement: cabinet.placement,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      rooms: (project.rooms ?? [])
        .map((room) => ({ id: room.id, name: room.name, config: room.config }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    }),
  );
}
