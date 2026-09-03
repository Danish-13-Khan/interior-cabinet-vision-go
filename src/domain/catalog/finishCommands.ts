import type { InteriorProject, MaterialEntity } from "../interiorProject";
import type { CatalogItem, CatalogMaterial } from "./types";
import {
  catalogSlotPoliciesForObject,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterials,
  pinnedCatalogItemVersion,
} from "./catalogLookup";
import { assertSlotEditable, isMaterialCompatibleWithSlot, tagsFromMaterialExtensions } from "./materialCompatibility";
import type { FinishUvRebind } from "./finishRebind";
import {
  countMaterialReferences,
  detachCatalogLineage,
  ensureCatalogMaterialSnapshot,
  rebindMaterialTarget,
} from "./materialSnapshots";

function candidateFromProjectMaterial(material: MaterialEntity) {
  return { id: material.id, kind: material.kind, tags: tagsFromMaterialExtensions(material.extensions) };
}

/** Paint an object slot using catalog lock/compatibility from the object's catalog identity. */
export function paintObjectSlotWithPolicy(
  project: InteriorProject,
  args: { objectId: string; slotName: string; materialId: string },
): InteriorProject {
  const object = project.objects.find((candidate) => candidate.id === args.objectId);
  if (!object) return project;
  const policy = catalogSlotPoliciesForObject(object)?.[args.slotName];
  if (policy) {
    assertSlotEditable(policy, args.slotName);
    const material = project.materials.find((item) => item.id === args.materialId);
    if (!material) throw new Error(`Unknown material ${args.materialId}`);
    if (!isMaterialCompatibleWithSlot(candidateFromProjectMaterial(material), policy)) {
      throw new Error(`Material is incompatible with slot "${args.slotName}"`);
    }
  }
  return rebindMaterialTarget(project, { kind: "object", objectId: args.objectId, slotName: args.slotName }, args.materialId);
}

/** Restore pinned catalog-item-version defaults; original GLB when a slot has no default. */
export function resetObjectFinishToCatalogDefaults(
  project: InteriorProject,
  objectId: string,
  catalogItem?: CatalogItem,
  catalogMaterials?: readonly CatalogMaterial[],
): InteriorProject {
  const object = project.objects.find((candidate) => candidate.id === objectId);
  if (!object) return project;
  const pinned = pinnedCatalogItemVersion(object);
  const item = catalogItem ?? lookupBuiltInCatalogItem(object.catalogItemId, pinned);
  if (!item) return project;
  if (pinned !== undefined && item.version !== pinned) return project;
  const library = catalogMaterials ?? lookupBuiltInCatalogMaterials();
  const byId = new Map(library.map((material) => [material.id, material]));
  let next = project;
  const nextSlots: Record<string, string> = {};
  for (const [slotName, policy] of Object.entries(item.materialSlots)) {
    if (!policy.defaultMaterialId) continue;
    const catalogMaterial = byId.get(policy.defaultMaterialId);
    if (!catalogMaterial) continue;
    const ensured = ensureCatalogMaterialSnapshot(next, catalogMaterial);
    next = ensured.project;
    nextSlots[slotName] = ensured.materialId;
  }
  return {
    ...next,
    objects: next.objects.map((candidate) => {
      if (candidate.id !== objectId) return candidate;
      const extensions = { ...candidate.extensions };
      delete extensions.catalogItemVersion;
      return {
        ...candidate,
        materialSlots: nextSlots,
        catalogItemVersion: item.version,
        extensions,
      };
    }),
  };
}

/** Clone-on-write when a shared project material is edited; detach catalog lineage on customize. */
export function mutateProjectMaterialCow(
  project: InteriorProject,
  args: {
    materialId: string;
    patch: Partial<Pick<MaterialEntity, "name" | "color" | "roughness" | "metalness" | "opacity">> & {
      extensions?: Record<string, unknown>;
    };
    rebind?: FinishUvRebind;
  },
): InteriorProject {
  const current = project.materials.find((material) => material.id === args.materialId);
  if (!current) throw new Error(`Unknown material ${args.materialId}`);
  const refs = countMaterialReferences(project, args.materialId);
  const shouldClone = refs > 1 && Boolean(args.rebind);
  const applyPatch = (material: MaterialEntity): MaterialEntity => {
    const patched = {
      ...material,
      ...args.patch,
      extensions: { ...material.extensions, ...args.patch.extensions },
    };
    return detachCatalogLineage(patched);
  };
  if (!shouldClone) {
    return {
      ...project,
      materials: project.materials.map((material) =>
        material.id === args.materialId ? applyPatch(material) : material,
      ),
    };
  }
  const cloneId = `${args.materialId}-clone-${Date.now()}`;
  const clone = applyPatch({ ...current, id: cloneId, extensions: { ...current.extensions, clonedFrom: args.materialId } });
  let next: InteriorProject = { ...project, materials: [...project.materials, clone] };
  if (args.rebind) next = rebindMaterialTarget(next, args.rebind, cloneId);
  return next;
}

export type { FinishUvRebind };
