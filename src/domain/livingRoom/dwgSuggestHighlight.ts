import type { Point2Mm } from "../interiorProject";
import { cadToPlanPoint } from "./dwgPlanMap";
import { dwgStrokeCadPoints } from "./dwgStrokeCadPoints";
import {
  dwgSuggestSegmentHitsRegion,
  resolveDwgSuggestLayerNames,
  type DwgSuggestPlanRegion,
} from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

export type DwgSuggestHighlightStroke = { layer: string; points: Point2Mm[] };

const MAX_STROKES = 8000;

function strokeHitsRegion(points: Point2Mm[], region: DwgSuggestPlanRegion | null): boolean {
  if (!region) return true;
  for (let index = 1; index < points.length; index += 1) {
    if (dwgSuggestSegmentHitsRegion(points[index - 1]!, points[index]!, region)) return true;
  }
  return points.some((point) => dwgSuggestSegmentHitsRegion(point, point, region));
}

/** Plan polylines for the geometry currently selected for wall detection. */
export function dwgSuggestHighlightStrokes(
  underlay: LivingRoomPlanUnderlay | null,
  requestedLayers?: readonly string[] | null,
  region?: DwgSuggestPlanRegion | null,
): DwgSuggestHighlightStroke[] {
  const source = underlay?.dwg;
  if (!underlay || !source || underlay.hidden) return [];
  const allowed = new Set(resolveDwgSuggestLayerNames(underlay, requestedLayers));
  const strokes: DwgSuggestHighlightStroke[] = [];
  for (const layer of source.preview.layers) {
    if (!allowed.has(layer.name)) continue;
    for (const path of layer.paths) {
      if (strokes.length >= MAX_STROKES) return strokes;
      const points = dwgStrokeCadPoints(path.d, path.matrix).map((cad) => (
        cadToPlanPoint(cad, underlay, source.preview.bounds)
      ));
      if (points.length < 2 || !strokeHitsRegion(points, region ?? null)) continue;
      strokes.push({ layer: layer.name, points });
    }
  }
  return strokes;
}
