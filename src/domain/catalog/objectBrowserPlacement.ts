import type { CatalogItem, CatalogPlacement } from "./types";
import type { InteriorProject, Point2Mm, Point3Mm } from "../interiorProject";
import { roomPlanPolygon, roomPlanViewBounds } from "../interiorProject";
import {
  oversizedBrowserFallbackPoint,
  rectangleBoundsAsPolygon,
  searchBrowserFootprintFit,
} from "./objectBrowserInteriorSearch";

export {
  browserFootprintFitsRoom,
  guaranteedInteriorPlanPoint,
  oversizedBrowserFallbackPoint,
  rectangleBoundsAsPolygon,
  searchBrowserFootprintFit,
} from "./objectBrowserInteriorSearch";

/**
 * Curated default elevations (mm) for non-floor browser items.
 * Matches template compositions — inspector cannot edit Y today.
 */
const BROWSER_PLACEMENT_Y_BY_ID: Record<string, number> = {
  "kenney:television-modern": 450,
  "kenney:lamp-round-table": 550,
  "kenney:pillow": 620,
  "kenney:hood-modern": 1600,
  "kenney:bathroom-mirror": 1100,
  "kenney:kitchen-microwave": 720,
  "kenney:kitchen-coffee-machine": 900,
  "kenney:computer-screen": 750,
  "kenney:computer-keyboard": 750,
  "kenney:computer-mouse": 750,
  "kenney:laptop": 750,
};

/** Fallback when an item has no curated elevation. */
export function defaultBrowserPlacementYMm(placement: CatalogPlacement): number {
  if (placement === "wall") return 1100;
  if (placement === "surface") return 750;
  if (placement === "ceiling") return 2400;
  return 0;
}

/** Prefer curated per-item height; fall back to placement-class defaults. */
export function browserPlacementYMmForItem(item: CatalogItem): number {
  const curated = BROWSER_PLACEMENT_Y_BY_ID[item.id];
  if (typeof curated === "number") return curated;
  return defaultBrowserPlacementYMm(item.placement);
}

/**
 * Pick a plan point inside the room where the item footprint fits.
 * Fine search always validates the full footprint before the oversized policy.
 */
export function findInteriorBrowserPlanPoint(
  project: InteriorProject,
  roomId: string,
  item: CatalogItem,
  roomObjectCount = project.objects.filter((object) => object.roomId === roomId).length,
): Point2Mm {
  const topology = roomPlanPolygon(project, roomId);
  const polygon = topology ?? rectangleBoundsAsPolygon(roomPlanViewBounds(project, roomId));
  const fit = searchBrowserFootprintFit(
    polygon,
    item.dimensionsMm.width,
    item.dimensionsMm.depth,
    roomObjectCount,
  );
  if (fit) return fit;
  const oversized = oversizedBrowserFallbackPoint(polygon);
  if (oversized) return oversized;
  throw new Error(`No interior placement found in room ${roomId} for ${item.id}`);
}

/**
 * Place on a validated interior plan point (not AABB center) so L-shaped
 * rooms and rooms with holes do not spawn into cutouts.
 */
export function defaultBrowserPlacementPosition(
  project: InteriorProject,
  roomId: string,
  item: CatalogItem,
): Point3Mm {
  const plan = findInteriorBrowserPlanPoint(project, roomId, item);
  return {
    x: plan.x,
    y: browserPlacementYMmForItem(item),
    z: plan.z,
  };
}
