import type {
  InteriorObjectEntity,
  InteriorObjectKind,
  InteriorProject,
  Point3Mm,
} from "../interiorProject";
import { lookupBuiltInCatalogItem, lookupBuiltInCatalogMaterials } from "./catalogLookup";
import { resetObjectFinishToCatalogDefaults } from "./finishCommands";
import type { CatalogItem } from "./types";

export type CatalogObjectPlacement = {
  objectId: string;
  roomId: string;
  position: Point3Mm;
  rotationY?: number;
};

function kindFromCategory(category: string): InteriorObjectKind {
  if (category === "lighting") return "lighting";
  if (category === "decor") return "decor";
  return "furniture";
}

function objectFromCatalogItem(
  item: CatalogItem,
  placement: CatalogObjectPlacement,
): InteriorObjectEntity {
  return {
    id: placement.objectId,
    roomId: placement.roomId,
    kind: kindFromCategory(item.category),
    category: item.category,
    catalogItemId: item.id,
    catalogItemVersion: item.version,
    name: item.name,
    position: { ...placement.position },
    rotation: { x: 0, y: placement.rotationY ?? 0, z: 0 },
    dimensions: {
      widthMm: item.dimensionsMm.width,
      heightMm: item.dimensionsMm.height,
      depthMm: item.dimensionsMm.depth,
    },
    materialSlots: {},
    parameters: {},
    extensions: { placement: item.placement },
  };
}

/**
 * Place a catalog item and snapshot its default finishes into the project.
 * Rejects non-active, non-template-eligible, or duplicate object ids.
 */
export function placeCatalogItemWithDefaults(
  project: InteriorProject,
  catalogItemId: string,
  placement: CatalogObjectPlacement,
): InteriorProject {
  const item = lookupBuiltInCatalogItem(catalogItemId);
  if (!item) throw new Error(`Unknown catalog item ${catalogItemId}`);
  if (item.lifecycle !== "active") {
    throw new Error(
      item.lifecycle === "blocked"
        ? `Catalog item ${catalogItemId} is blocked`
        : `Catalog item ${catalogItemId} is not active`,
    );
  }
  if (!item.visibility.templateEligible) {
    throw new Error(`Catalog item ${catalogItemId} is not template-eligible`);
  }
  if (project.objects.some((candidate) => candidate.id === placement.objectId)) {
    throw new Error(`Object id ${placement.objectId} already exists`);
  }
  const object = objectFromCatalogItem(item, placement);
  const withObject: InteriorProject = {
    ...project,
    objects: [...project.objects, object],
  };
  return resetObjectFinishToCatalogDefaults(
    withObject,
    placement.objectId,
    item,
    lookupBuiltInCatalogMaterials(),
  );
}
