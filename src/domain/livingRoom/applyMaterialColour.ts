import {
  countMaterialReferences,
  detachCatalogLineage,
  rebindMaterialTarget,
} from "../catalog/materialSnapshots";
import type { FinishUvRebind } from "../catalog/finishRebind";
import type { InteriorProject, MaterialEntity } from "../interiorProject";
import { normalizeHexColour } from "./materialColourFormat";
import { recordRecentMaterialColour } from "./recentMaterialColours";

export type ApplyMaterialColourArgs = {
  materialId: string;
  color: string;
  /** When shared, clone-on-write once and rebind all of these targets. */
  rebinds?: readonly FinishUvRebind[];
};

function uniqueMaterialCloneId(project: InteriorProject, materialId: string): string {
  const existing = new Set(project.materials.map((material) => material.id));
  const stamp = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let id = `${materialId}-clone-${stamp}`;
  let suffix = 0;
  while (existing.has(id)) {
    suffix += 1;
    id = `${materialId}-clone-${stamp}-${suffix}`;
  }
  return id;
}

function applyColourPatch(material: MaterialEntity, color: string): MaterialEntity {
  return detachCatalogLineage({
    ...material,
    color,
    extensions: { ...material.extensions },
  });
}

/**
 * Tint a project material (one COW clone when shared + rebinds),
 * then record the colour in recentMaterialColours.
 */
export function applyMaterialColour(
  project: InteriorProject,
  args: ApplyMaterialColourArgs,
): InteriorProject {
  const color = normalizeHexColour(args.color);
  if (!color) return project;
  const current = project.materials.find((material) => material.id === args.materialId);
  if (!current) return project;

  const rebinds = args.rebinds ?? [];
  let next = project;
  let resultMaterialId = args.materialId;

  if (rebinds.length === 0 || countMaterialReferences(project, args.materialId) <= 1) {
    next = {
      ...project,
      materials: project.materials.map((material) =>
        material.id === args.materialId ? applyColourPatch(material, color) : material,
      ),
    };
    for (const rebind of rebinds) {
      next = rebindMaterialTarget(next, rebind, args.materialId);
    }
  } else {
    const cloneId = uniqueMaterialCloneId(project, args.materialId);
    const clone = applyColourPatch({
      ...current,
      id: cloneId,
      extensions: { ...current.extensions, clonedFrom: args.materialId },
    }, color);
    next = { ...project, materials: [...project.materials, clone] };
    for (const rebind of rebinds) {
      next = rebindMaterialTarget(next, rebind, cloneId);
    }
    resultMaterialId = cloneId;
  }

  const ids = next.materials.map((material) => material.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("applyMaterialColour produced duplicate material ids");
  }

  return recordRecentMaterialColour(next, { color, materialId: resultMaterialId });
}
