import { distMm } from "../proposalGeom";
import type { ArchitecturalScene, ArchitecturalWall } from "./archSceneTypes";

export type CabinetWallSpan = {
  wallId: string;
  lengthMm: number;
  usableMm: number;
  openingIds: string[];
  type: ArchitecturalWall["type"];
};

/** Phase 12: wall spans usable for cabinet runs (exclude opening widths). */
export function cabinetWallSpans(scene: ArchitecturalScene): CabinetWallSpan[] {
  return scene.walls.map((w) => {
    const lengthMm = distMm(w.start, w.end);
    const openingWidth = scene.openings
      .filter((o) => o.wallId === w.id)
      .reduce((s, o) => s + o.widthMm, 0);
    return {
      wallId: w.id,
      lengthMm,
      usableMm: Math.max(0, lengthMm - openingWidth),
      openingIds: w.openingIds,
      type: w.type,
    };
  });
}

export type CatalogMap = Record<string, string>;

export const DEFAULT_FIXTURE_CATALOG: CatalogMap = {
  "fixture:sink": "catalog.sink.base",
  "fixture:hob": "catalog.hob.base",
  "fixture:refrigerator": "catalog.fridge.base",
  door: "catalog.door.swing",
  window: "catalog.window.fixed",
};

export function mapFixturesToCatalog(
  scene: ArchitecturalScene,
  catalog: CatalogMap = DEFAULT_FIXTURE_CATALOG,
): Array<{ fixtureId: string; catalogId: string }> {
  return scene.fixtures
    .map((f) => ({ fixtureId: f.id, catalogId: catalog[f.type] }))
    .filter((x): x is { fixtureId: string; catalogId: string } => Boolean(x.catalogId));
}
