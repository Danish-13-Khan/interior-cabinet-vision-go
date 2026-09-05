import { publicAssetUrl } from "../../utils/publicAssetUrl";
import {
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogItem,
} from "./catalogLookup";
import { placeCatalogItemWithDefaults } from "./placeCatalogItem";
import { defaultBrowserPlacementPosition } from "./objectBrowserPlacement";
import type { CatalogItem, CatalogPlacement } from "./types";
import type { InteriorProject, Point3Mm } from "../interiorProject";
import { BUILTIN_CATALOG_MANIFEST } from "./builtinCatalogManifest";

export {
  browserFootprintFitsRoom,
  browserPlacementYMmForItem,
  defaultBrowserPlacementPosition,
  defaultBrowserPlacementYMm,
  findInteriorBrowserPlanPoint,
  guaranteedInteriorPlanPoint,
  oversizedBrowserFallbackPoint,
  rectangleBoundsAsPolygon,
  searchBrowserFootprintFit,
} from "./objectBrowserPlacement";

const MANIFEST = BUILTIN_CATALOG_MANIFEST;

/** Roadmap §11.1 navigation groups → catalog category ids. */
export const OBJECT_BROWSER_CATEGORIES = [
  { id: "all", label: "All", catalogCategories: null },
  { id: "seating", label: "Seating", catalogCategories: ["seating"] },
  { id: "tables", label: "Tables", catalogCategories: ["tables-and-desks"] },
  { id: "beds", label: "Beds", catalogCategories: ["beds-and-bedroom"] },
  { id: "storage", label: "Storage", catalogCategories: ["storage"] },
  { id: "kitchen", label: "Kitchen appliances", catalogCategories: ["kitchen-and-appliances"] },
  { id: "bathroom", label: "Bathroom", catalogCategories: ["bathroom"] },
  { id: "office", label: "Office and electronics", catalogCategories: ["electronics"] },
  { id: "lighting", label: "Lighting", catalogCategories: ["lighting"] },
  { id: "decor", label: "Decor", catalogCategories: ["decor"] },
  { id: "utility", label: "Utility", catalogCategories: ["utility"] },
] as const;

export type ObjectBrowserCategoryId = (typeof OBJECT_BROWSER_CATEGORIES)[number]["id"];

export type ObjectBrowserCard = {
  id: string;
  name: string;
  category: string;
  placement: CatalogPlacement;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  thumbnailUrl: string | null;
  finishesEditable: boolean;
};

export type ObjectBrowserQuery = {
  categoryId?: ObjectBrowserCategoryId | string;
  text?: string;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function itemMatchesText(item: CatalogItem, needle: string): boolean {
  if (!needle) return true;
  const haystack = normalizeSearchText(
    [item.name, item.category, item.subcategory, ...item.tags].join(" "),
  );
  return haystack.includes(needle);
}

function categoryAllows(item: CatalogItem, categoryId: string): boolean {
  const group = OBJECT_BROWSER_CATEGORIES.find((entry) => entry.id === categoryId);
  if (!group || group.catalogCategories === null) return true;
  return (group.catalogCategories as readonly string[]).includes(item.category);
}

/** Approved catalog items visible in the customer object browser. */
export function listObjectBrowserItems(query: ObjectBrowserQuery = {}): CatalogItem[] {
  const needle = normalizeSearchText(query.text ?? "");
  const categoryId = query.categoryId ?? "all";
  return MANIFEST.items
    .filter((item) => item.lifecycle === "active" && item.visibility.objectBrowser)
    .filter((item) => categoryAllows(item, categoryId))
    .filter((item) => itemMatchesText(item, needle))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogItemThumbnailUrl(item: CatalogItem): string | null {
  const thumbId = item.images.thumbnailId;
  if (!thumbId) return null;
  const file = lookupBuiltInCatalogFile(thumbId);
  if (!file || file.kind !== "image") return null;
  return publicAssetUrl(file.objectKey);
}

export function catalogItemHasEditableFinish(item: CatalogItem): boolean {
  return Object.values(item.materialSlots).some((slot) => slot.editable);
}

export function toObjectBrowserCard(item: CatalogItem): ObjectBrowserCard {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    placement: item.placement,
    widthMm: item.dimensionsMm.width,
    depthMm: item.dimensionsMm.depth,
    heightMm: item.dimensionsMm.height,
    thumbnailUrl: catalogItemThumbnailUrl(item),
    finishesEditable: catalogItemHasEditableFinish(item),
  };
}

export function listObjectBrowserCards(query: ObjectBrowserQuery = {}): ObjectBrowserCard[] {
  return listObjectBrowserItems(query).map(toObjectBrowserCard);
}

/** True when an item may be newly placed from the object browser. */
export function isObjectBrowserPlaceable(item: CatalogItem | null | undefined): item is CatalogItem {
  return Boolean(item && item.visibility.objectBrowser && item.lifecycle === "active");
}

/**
 * Place a browser-visible catalog item with default finishes and realistic size.
 * Rejects items that are not object-browser approved or not actively placeable.
 */
export function placeObjectBrowserItem(
  project: InteriorProject,
  catalogItemId: string,
  options: { objectId: string; roomId: string; position?: Point3Mm },
): InteriorProject {
  const item = lookupBuiltInCatalogItem(catalogItemId);
  if (!isObjectBrowserPlaceable(item)) {
    throw new Error(`Catalog item ${catalogItemId} is not available in the object browser`);
  }
  return placeCatalogItemWithDefaults(project, catalogItemId, {
    objectId: options.objectId,
    roomId: options.roomId,
    position:
      options.position ?? defaultBrowserPlacementPosition(project, options.roomId, item),
  });
}
