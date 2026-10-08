import type { Point2Mm, WallEntity } from "../../interiorProject";
import { selectOpeningsForRoom } from "../../interiorProject";
import { getObjectPlanBounds } from "../planGeometry";
import { PLAN_SNAP_PRIORITY, type PlanSnapCandidate, type PlanSnapContext, type PlanSnapKind } from "./types";

/** Two candidates closer than this are the same point; the earlier (higher-priority) one wins. */
const DEDUPE_MM = 0.5;

/** Visible walls minus the ones being translated; these still offer their crossings. */
function wallsForIntersections(ctx: PlanSnapContext): WallEntity[] {
  const wallIds = new Set(ctx.exclude?.wallIds ?? []);
  return ctx.project.walls.filter((wall) => wall.visible && !wallIds.has(wall.id));
}

/**
 * Walls whose own line can be a target (midpoint, on-wall). A wall attached to
 * the dragged node moves with it, so its midpoint and its line are not targets;
 * its crossing with a static wall still is, because landing there puts the node
 * exactly on the other wall (collect.ts handles that in `wallsForIntersections`).
 */
function wallsForSnapping(ctx: PlanSnapContext): WallEntity[] {
  const nodeIds = new Set(ctx.exclude?.nodeIds ?? []);
  return wallsForIntersections(ctx).filter((wall) =>
    !(wall.startNodeId && nodeIds.has(wall.startNodeId))
    && !(wall.endNodeId && nodeIds.has(wall.endNodeId)));
}

/** Intersection of two centrelines, each allowed to extend by `extendMm` past its ends. */
export function wallLineIntersection(a: WallEntity, b: WallEntity, extendMm: number): Point2Mm | null {
  const ax = a.end.x - a.start.x;
  const az = a.end.z - a.start.z;
  const bx = b.end.x - b.start.x;
  const bz = b.end.z - b.start.z;
  const denominator = ax * bz - az * bx;
  const aLength = Math.hypot(ax, az);
  const bLength = Math.hypot(bx, bz);
  if (Math.abs(denominator) < 1e-9 || aLength < 1e-9 || bLength < 1e-9) return null;
  const dx = b.start.x - a.start.x;
  const dz = b.start.z - a.start.z;
  const t = (dx * bz - dz * bx) / denominator;
  const u = (dx * az - dz * ax) / denominator;
  const tMin = -extendMm / aLength;
  const uMin = -extendMm / bLength;
  if (t < tMin || t > 1 - tMin || u < uMin || u > 1 - uMin) return null;
  return { x: a.start.x + ax * t, z: a.start.z + az * t };
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Fixed-position candidates for the current project. Collected once per
 * project change and reused for every pointer move; the line-like kinds are
 * resolved in `pickPlanSnap`. `intersectionExtendMm` lets two walls that stop
 * just short of each other still offer their crossing.
 */
export function collectPlanSnapCandidates(ctx: PlanSnapContext, intersectionExtendMm = 0): PlanSnapCandidate[] {
  const allowed = ctx.allow ? new Set<PlanSnapKind>(ctx.allow) : null;
  const candidates: PlanSnapCandidate[] = [];
  const seen: Point2Mm[] = [];

  function push(kind: PlanSnapKind, point: Point2Mm, label: string, sourceId?: string) {
    if (allowed && !allowed.has(kind)) return;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return;
    if (seen.some((other) => Math.hypot(other.x - point.x, other.z - point.z) < DEDUPE_MM)) return;
    seen.push(point);
    candidates.push({ kind, point: { x: point.x, z: point.z }, label, sourceId, priority: PLAN_SNAP_PRIORITY[kind] });
  }

  const excludedNodes = new Set(ctx.exclude?.nodeIds ?? []);
  for (const node of ctx.project.nodes) {
    if (excludedNodes.has(node.id)) continue;
    push("node", node.position, "Node", node.id);
  }

  for (const point of ctx.dwgEndpoints ?? []) push("dwg-end", point, "DWG endpoint");

  const crossing = wallsForIntersections(ctx);
  for (let i = 0; i < crossing.length; i += 1) {
    for (let j = i + 1; j < crossing.length; j += 1) {
      const hit = wallLineIntersection(crossing[i]!, crossing[j]!, intersectionExtendMm);
      if (hit) push("intersection", hit, "Intersection", `${crossing[i]!.id}|${crossing[j]!.id}`);
    }
  }

  for (const wall of wallsForSnapping(ctx)) {
    push("midpoint", { x: (wall.start.x + wall.end.x) / 2, z: (wall.start.z + wall.end.z) / 2 }, "Wall midpoint", wall.id);
  }

  const roomId = ctx.roomId === undefined ? ctx.project.activeRoomId : ctx.roomId;
  const openings = roomId ? selectOpeningsForRoom(ctx.project, roomId) : ctx.project.openings;
  const wallById = new Map(ctx.project.walls.map((wall) => [wall.id, wall]));
  for (const opening of openings) {
    const wall = wallById.get(opening.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz) || 1;
    const ux = dx / length;
    const uz = dz / length;
    const along = (offset: number) => ({ x: wall.start.x + ux * offset, z: wall.start.z + uz * offset });
    const name = capitalise(opening.kind);
    push("opening-centre", along(opening.offsetMm + opening.widthMm / 2), `${name} centre`, opening.id);
    push("opening-edge", along(opening.offsetMm), `${name} edge`, opening.id);
    push("opening-edge", along(opening.offsetMm + opening.widthMm), `${name} edge`, opening.id);
  }

  for (const object of ctx.project.objects) {
    if (roomId && object.roomId !== roomId) continue;
    const bounds = getObjectPlanBounds(object);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    push("cabinet-centre", { x: cx, z: cz }, "Cabinet centre", object.id);
    for (const corner of [
      { x: bounds.minX, z: bounds.minZ }, { x: bounds.maxX, z: bounds.minZ },
      { x: bounds.minX, z: bounds.maxZ }, { x: bounds.maxX, z: bounds.maxZ },
      { x: cx, z: bounds.minZ }, { x: cx, z: bounds.maxZ }, { x: bounds.minX, z: cz }, { x: bounds.maxX, z: cz },
    ]) push("cabinet-edge", corner, "Cabinet edge", object.id);
  }

  return candidates;
}

export function snapWallsForContext(ctx: PlanSnapContext): WallEntity[] {
  return wallsForSnapping(ctx);
}
