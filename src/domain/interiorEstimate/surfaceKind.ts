import type { InteriorProject, MaterialKind, WallEntity } from "../interiorProject";

/** Wall / floor / ceiling finish kind from the assigned material, if any. */
export function surfaceMaterialKind(
  project: InteriorProject,
  materialId: string | null | undefined,
): MaterialKind | null {
  if (!materialId) return null;
  return project.materials.find((material) => material.id === materialId)?.kind ?? null;
}

/**
 * Rate category for a measured surface. Wallpaper, tile and acrylic get their
 * own category so a shop can price them separately from generic paint.
 */
export function surfaceRateCategory(
  kind: "floor" | "ceiling" | "wall",
  materialKind: MaterialKind | null,
): string {
  if (materialKind === "wallpaper" && kind === "wall") return "surface.wall.wallpaper";
  if (materialKind === "tile") return kind === "floor" ? "surface.tile" : "surface.wall.tile";
  if (materialKind === "acrylic") return "finish.acrylic";
  return `surface.${kind}`;
}

export function wallFinishKind(project: InteriorProject, wall: WallEntity): MaterialKind | null {
  const zone = project.surfaces.find((surface) =>
    surface.kind === "wall" && (surface.extensions?.wallId === wall.id || surface.id === `wall:${wall.id}`));
  return surfaceMaterialKind(project, zone?.materialId ?? wall.materialId);
}
