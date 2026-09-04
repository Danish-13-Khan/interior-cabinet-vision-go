import type { InteriorObjectEntity, Point2Mm } from "../interiorProject";
import { pointInPolygon } from "../interiorProject";
import { getObjectPlanCorners } from "./planGeometry";

/** Categories that never obstruct circulation (legacy procedural catalog). */
const NON_BLOCKING_CATEGORIES = new Set([
  "rug",
  "mirror",
  "feature-wall",
  "display-niche",
  "accessory",
  "ceiling-fixture",
  "window-treatment",
  "filler",
]);

/** Ordinary surface items must sit near the support top (±slack). */
const SURFACE_SUPPORT_TOP_SLACK_MM = 80;
/** Soft goods (pillows) may nest in the upper portion of a support volume. */
const SOFT_GOODS_NEST_MIN_RATIO = 0.45;

function placementOf(object: InteriorObjectEntity): string | undefined {
  const value = object.extensions?.placement;
  return typeof value === "string" ? value : undefined;
}

/** Floor rugs / mats — may sit under furniture without counting as collision. */
export function isRugLikeObject(object: InteriorObjectEntity): boolean {
  if (object.category === "rug") return true;
  if (object.catalogItemId.includes("rug")) return true;
  return placementOf(object) === "floor" && object.dimensions.heightMm <= 30;
}

/** Objects placed on another surface (lamp on nightstand, pillow on bed, TV on cabinet). */
export function isSurfaceMountedObject(object: InteriorObjectEntity): boolean {
  return placementOf(object) === "surface";
}

/**
 * Soft goods may nest into a support (pillow on mattress). Opt in via catalog id
 * or `extensions.surfaceSupport = "nested"`.
 */
export function isNestedSoftGoodsSurface(object: InteriorObjectEntity): boolean {
  if (!isSurfaceMountedObject(object)) return false;
  if (object.extensions?.surfaceSupport === "nested") return true;
  return object.catalogItemId.includes("pillow");
}

/** True when plan footprints may collide but volumes do not stack in height. */
export function verticallySeparated(
  first: InteriorObjectEntity,
  second: InteriorObjectEntity,
): boolean {
  const firstTop = first.position.y + first.dimensions.heightMm;
  const secondTop = second.position.y + second.dimensions.heightMm;
  return firstTop <= second.position.y || secondTop <= first.position.y;
}

function planCenterOnSupport(
  surface: InteriorObjectEntity,
  support: InteriorObjectEntity,
): boolean {
  const center: Point2Mm = { x: surface.position.x, z: surface.position.z };
  return pointInPolygon(center, getObjectPlanCorners(support));
}

/**
 * Surface item whose plan center sits on a floor support.
 * Ordinary props must rest near the support top; soft goods may nest in the
 * upper support volume (e.g. pillow on a mattress).
 */
export function isSurfaceRestingOnSupport(
  surface: InteriorObjectEntity,
  support: InteriorObjectEntity,
): boolean {
  if (!isSurfaceMountedObject(surface) || isSurfaceMountedObject(support)) return false;
  if (isRugLikeObject(support) || NON_BLOCKING_CATEGORIES.has(support.category)) return false;
  if (!planCenterOnSupport(surface, support)) return false;

  const supportTop = support.position.y + support.dimensions.heightMm;
  const surfaceBottom = surface.position.y;
  if (surfaceBottom > supportTop + SURFACE_SUPPORT_TOP_SLACK_MM) return false;

  if (isNestedSoftGoodsSurface(surface)) {
    const nestFloor = support.position.y + support.dimensions.heightMm * SOFT_GOODS_NEST_MIN_RATIO;
    return surfaceBottom >= nestFloor;
  }

  return surfaceBottom >= supportTop - SURFACE_SUPPORT_TOP_SLACK_MM;
}

/** Skip overlap/circulation for rugs, vertical stacks, and supported surface mounts. */
export function shouldIgnoreCollisionPair(
  first: InteriorObjectEntity,
  second: InteriorObjectEntity,
): boolean {
  if (isRugLikeObject(first) || isRugLikeObject(second)) return true;
  if (verticallySeparated(first, second)) return true;
  return isSurfaceRestingOnSupport(first, second) || isSurfaceRestingOnSupport(second, first);
}

/**
 * Objects that participate in outside-room and opening-clearance checks.
 * Rugs / wall treatments stay excluded; surface mounts stay included.
 */
export function isPlanObstacle(object: InteriorObjectEntity): boolean {
  if (NON_BLOCKING_CATEGORIES.has(object.category)) return false;
  if (isRugLikeObject(object)) return false;
  return true;
}
