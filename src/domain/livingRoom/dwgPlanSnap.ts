import type { Point2Mm } from "../interiorProject";
import { transform } from "./dwgGeometryMath";
import { cadToPlanPoint } from "./dwgPlanMap";
import { getLivingRoomPlanUnderlay, type LivingRoomPlanUnderlay } from "./planUnderlay";
import type { InteriorProject } from "../interiorProject";

const COMMAND = /[ML]\s*(-?[\d.eE+]+)\s*[,\s]\s*(-?[\d.eE+]+)/g;
const MAX_POINTS = 20000;

function endpointsFromPath(d: string, matrix: number[]): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  COMMAND.lastIndex = 0;
  for (const match of d.matchAll(COMMAND)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    points.push(transform({ x, y }, matrix as [number, number, number, number, number, number]));
  }
  return points;
}

export function collectDwgPlanEndpoints(underlay: LivingRoomPlanUnderlay | null): Point2Mm[] {
  const source = underlay?.dwg;
  if (!underlay || !source) return [];
  const hidden = new Set(source.hiddenLayers);
  const seen = new Set<string>();
  const points: Point2Mm[] = [];
  for (const layer of source.preview.layers) {
    if (hidden.has(layer.name)) continue;
    for (const stroke of layer.paths) {
      for (const cad of endpointsFromPath(stroke.d, stroke.matrix)) {
        const plan = cadToPlanPoint(cad, underlay, source.preview.bounds);
        const key = `${Math.round(plan.x * 100)}:${Math.round(plan.z * 100)}`;
        if (seen.has(key) || points.length >= MAX_POINTS) continue;
        seen.add(key);
        points.push(plan);
      }
    }
  }
  return points;
}

export function collectProjectDwgPlanEndpoints(project: InteriorProject): Point2Mm[] {
  return collectDwgPlanEndpoints(getLivingRoomPlanUnderlay(project));
}

export function snapPlanPointToDwg(
  point: Point2Mm,
  snapSizeMm: number,
  extra: readonly Point2Mm[],
): Point2Mm {
  const snapped = {
    x: Math.round(point.x / snapSizeMm) * snapSizeMm,
    z: Math.round(point.z / snapSizeMm) * snapSizeMm,
  };
  let best = snapped;
  let bestDist = snapSizeMm / 2;
  for (const candidate of extra) {
    const dist = Math.hypot(candidate.x - point.x, candidate.z - point.z);
    if (dist <= bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}
