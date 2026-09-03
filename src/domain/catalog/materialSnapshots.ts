import type { InteriorProject, MaterialEntity } from "../interiorProject";
import { isGeneratedRoomSurface } from "../interiorProject";
import type { CatalogMaterial } from "./types";
import type { FinishUvRebind } from "./finishRebind";
import { withExtensions } from "./finishRebind";

function roomFinishId(room: InteriorProject["rooms"][number], kind: "floor" | "ceiling") {
  const value = room.extensions?.[kind === "floor" ? "floorMaterialId" : "ceilingMaterialId"];
  return typeof value === "string" ? value : undefined;
}

function collectMaterialRefIds(project: InteriorProject): string[] {
  const ids: string[] = [];
  for (const object of project.objects) ids.push(...Object.values(object.materialSlots));
  for (const opening of project.openings) {
    if (opening.materialSlots) ids.push(...Object.values(opening.materialSlots));
  }
  for (const wall of project.walls) {
    if (wall.materialId) ids.push(wall.materialId);
  }
  for (const room of project.rooms) {
    const floor = roomFinishId(room, "floor");
    const ceiling = roomFinishId(room, "ceiling");
    if (floor) ids.push(floor);
    if (ceiling) ids.push(ceiling);
  }
  for (const surface of project.surfaces) {
    if (!surface.materialId) continue;
    if (
      (surface.kind === "floor" || surface.kind === "ceiling")
      && isGeneratedRoomSurface(surface)
    ) {
      const room = project.rooms.find((item) => item.id === surface.roomId);
      if (room && roomFinishId(room, surface.kind)) continue;
    }
    ids.push(surface.materialId);
  }
  return ids;
}

export function countMaterialReferences(project: InteriorProject, materialId: string): number {
  return collectMaterialRefIds(project).filter((id) => id === materialId).length;
}

export function snapshotCatalogMaterial(
  catalogMaterial: CatalogMaterial,
  projectMaterialId: string,
): MaterialEntity {
  return {
    id: projectMaterialId,
    name: catalogMaterial.name,
    kind: catalogMaterial.kind,
    color: catalogMaterial.baseColor,
    roughness: catalogMaterial.roughness,
    metalness: catalogMaterial.metalness,
    opacity: catalogMaterial.opacity,
    extensions: {
      catalogMaterialId: catalogMaterial.id,
      catalogMaterialVersion: catalogMaterial.version,
      uvScaleMm: catalogMaterial.uvScaleMm,
      tags: catalogMaterial.tags,
      swatchColor: catalogMaterial.swatchColor,
    },
  };
}

export function isCanonicalCatalogSnapshot(
  material: MaterialEntity,
  catalogMaterial: CatalogMaterial,
): boolean {
  if (material.extensions?.catalogMaterialCustomized === true) return false;
  return (
    material.extensions?.catalogMaterialId === catalogMaterial.id &&
    material.extensions?.catalogMaterialVersion === catalogMaterial.version &&
    material.color === catalogMaterial.baseColor &&
    material.roughness === catalogMaterial.roughness &&
    material.metalness === catalogMaterial.metalness &&
    material.opacity === catalogMaterial.opacity
  );
}

export function detachCatalogLineage(material: MaterialEntity): MaterialEntity {
  const extensions: Record<string, unknown> = {
    ...material.extensions,
    catalogMaterialCustomized: true,
  };
  delete extensions.catalogMaterialId;
  delete extensions.catalogMaterialVersion;
  return { ...material, extensions };
}

function nextSnapshotId(project: InteriorProject, catalogMaterialId: string): string {
  const base = `proj-${catalogMaterialId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const used = new Set(project.materials.map((material) => material.id));
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

/** Reuse only unmodified, version-matching catalog snapshots. */
export function ensureCatalogMaterialSnapshot(
  project: InteriorProject,
  catalogMaterial: CatalogMaterial,
): { project: InteriorProject; materialId: string } {
  const existing = project.materials.find((material) =>
    isCanonicalCatalogSnapshot(material, catalogMaterial),
  );
  if (existing) return { project, materialId: existing.id };
  const materialId = nextSnapshotId(project, catalogMaterial.id);
  const snapshot = snapshotCatalogMaterial(catalogMaterial, materialId);
  return { project: { ...project, materials: [...project.materials, snapshot] }, materialId };
}

export function rebindMaterialTarget(
  project: InteriorProject,
  target: FinishUvRebind,
  materialId: string,
): InteriorProject {
  if (target.kind === "object") {
    return {
      ...project,
      objects: project.objects.map((object) =>
        object.id === target.objectId
          ? { ...object, materialSlots: { ...object.materialSlots, [target.slotName]: materialId } }
          : object,
      ),
    };
  }
  if (target.kind === "wall") {
    return {
      ...project,
      walls: project.walls.map((wall) =>
        wall.id === target.wallId ? { ...wall, materialId } : wall,
      ),
    };
  }
  const surfaceKind = target.kind;
  const roomKey = surfaceKind === "floor" ? "floorMaterialId" : "ceilingMaterialId";
  return {
    ...project,
    rooms: project.rooms.map((room) =>
      room.id === project.activeRoomId ? withExtensions(room, { [roomKey]: materialId }) : room,
    ),
    surfaces: project.surfaces.map((surface) =>
      surface.roomId === project.activeRoomId && surface.kind === surfaceKind
        ? { ...surface, materialId }
        : surface,
    ),
  };
}
