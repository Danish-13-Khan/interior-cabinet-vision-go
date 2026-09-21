import type { Point2Mm } from "../interiorProject";
import { cadToPlanPoint } from "./dwgPlanMap";
import { transform, type Matrix, type Point } from "./dwgGeometryMath";
import { parseDwgPathCommands } from "./dwgPathCommands";
import {
  dwgSuggestSegmentHitsRegion,
  resolveDwgSuggestLayerNames,
  type DwgSuggestPlanRegion,
} from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

export type DwgSuggestCenterline = { a: Point2Mm; b: Point2Mm; layer: string };

export type DwgSuggestExtract = {
  segments: DwgSuggestCenterline[];
  skippedCurves: number;
};

const MAX_SEGMENTS = 20000;
const MIN_LEN_MM = 1;

function toPlan(
  cad: Point,
  matrix: number[],
  underlay: LivingRoomPlanUnderlay,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
): Point2Mm {
  return cadToPlanPoint(transform(cad, matrix as Matrix), underlay, bounds);
}

function emit(
  segments: DwgSuggestCenterline[],
  layer: string,
  a: Point2Mm,
  b: Point2Mm,
  region: DwgSuggestPlanRegion | null,
) {
  if (Math.hypot(b.x - a.x, b.z - a.z) < MIN_LEN_MM) return;
  if (region && !dwgSuggestSegmentHitsRegion(a, b, region)) return;
  if (segments.length < MAX_SEGMENTS) segments.push({ a, b, layer });
}

/** Straight LINE and polyline edges in plan millimetres. Curves are counted, not converted. */
export function extractDwgSuggestCenterlines(
  underlay: LivingRoomPlanUnderlay | null,
  requestedLayers?: readonly string[] | null,
  region?: DwgSuggestPlanRegion | null,
): DwgSuggestExtract {
  const source = underlay?.dwg;
  const empty: DwgSuggestExtract = { segments: [], skippedCurves: 0 };
  if (!underlay || !source || underlay.hidden) return empty;
  const allowed = new Set(resolveDwgSuggestLayerNames(underlay, requestedLayers));
  const segments: DwgSuggestCenterline[] = [];
  let skippedCurves = 0;
  const box = region ?? null;
  for (const layer of source.preview.layers) {
    if (!allowed.has(layer.name)) continue;
    for (const path of layer.paths) {
      if (path.fill) continue;
      let first: Point2Mm | null = null;
      let current: Point2Mm | null = null;
      for (const command of parseDwgPathCommands(path.d)) {
        if (command.type === "Z") {
          if (first && current) emit(segments, layer.name, current, first, box);
          continue;
        }
        const point = toPlan(command, path.matrix, underlay, source.preview.bounds);
        if (command.type === "M") {
          first = point;
          current = point;
          continue;
        }
        if (command.type === "A") {
          skippedCurves += 1;
          current = point;
          continue;
        }
        if (current) emit(segments, layer.name, current, point, box);
        current = point;
      }
    }
  }
  return { segments, skippedCurves };
}
