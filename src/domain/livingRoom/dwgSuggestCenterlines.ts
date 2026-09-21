import type { Point } from "./dwgGeometryMath";
import { cadToPlanPoint } from "./dwgPlanMap";
import { transform, type Matrix } from "./dwgGeometryMath";
import { parseDwgPathCommands } from "./dwgPathCommands";
import { clipSegmentToBox } from "./dwgSuggestClip";
import {
  clipPlanSegmentToRegion,
  normalizeDwgSuggestSegments,
  DWG_SUGGEST_MIN_LEN_MM,
  type DwgSuggestCenterline,
} from "./dwgSuggestNormalize";
import { resolveDwgSuggestLayerNames, type DwgSuggestPlanRegion } from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { DwgPlanBounds } from "./dwgUnits";

export type { DwgSuggestCenterline };

export type DwgSuggestExtract = {
  segments: DwgSuggestCenterline[];
  skippedCurves: number;
};

const MAX_SEGMENTS = 20000;

function worldPoint(cad: Point, matrix: number[]): Point {
  return transform(cad, matrix as Matrix);
}

function emit(
  segments: DwgSuggestCenterline[],
  layer: string,
  start: Point,
  end: Point,
  underlay: LivingRoomPlanUnderlay,
  bounds: DwgPlanBounds,
  region: DwgSuggestPlanRegion | null,
) {
  const cad = clipSegmentToBox(start, end, bounds);
  if (!cad) return;
  const a = cadToPlanPoint(cad.a, underlay, bounds);
  const b = cadToPlanPoint(cad.b, underlay, bounds);
  const plan = region ? clipPlanSegmentToRegion(a, b, region) : { a, b };
  if (!plan) return;
  if (Math.hypot(plan.b.x - plan.a.x, plan.b.z - plan.a.z) < DWG_SUGGEST_MIN_LEN_MM) return;
  if (segments.length < MAX_SEGMENTS) segments.push({ a: plan.a, b: plan.b, layer });
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
  const raw: DwgSuggestCenterline[] = [];
  let skippedCurves = 0;
  const bounds = source.preview.bounds;
  for (const layer of source.preview.layers) {
    if (!allowed.has(layer.name)) continue;
    for (const path of layer.paths) {
      if (path.fill) continue;
      let first: Point | null = null;
      let current: Point | null = null;
      for (const command of parseDwgPathCommands(path.d)) {
        if (command.type === "Z") {
          if (first && current) emit(raw, layer.name, current, first, underlay, bounds, region ?? null);
          continue;
        }
        const point = worldPoint(command, path.matrix);
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
        if (current) emit(raw, layer.name, current, point, underlay, bounds, region ?? null);
        current = point;
      }
    }
  }
  return { segments: normalizeDwgSuggestSegments(raw), skippedCurves };
}
