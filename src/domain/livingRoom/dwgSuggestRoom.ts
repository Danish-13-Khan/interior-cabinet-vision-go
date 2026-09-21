import type { Point2Mm } from "../interiorProject";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import { type DwgSuggestPlanRegion } from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

const EPS = 0.5;

type Seg = { a: Point2Mm; b: Point2Mm };

function key(point: Point2Mm) {
  return `${Math.round(point.x / EPS)}:${Math.round(point.z / EPS)}`;
}

function same(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z) <= EPS;
}

function segmentsFrom(
  underlay: LivingRoomPlanUnderlay,
  names?: string[],
  region?: DwgSuggestPlanRegion | null,
): Seg[] {
  return extractDwgSuggestCenterlines(underlay, names, region).segments.map(({ a, b }) => ({ a, b }));
}

function walk(segments: Seg[]): Point2Mm[] | null {
  if (segments.length < 3) return null;
  const unused = [...segments];
  const points: Point2Mm[] = [unused[0]!.a, unused[0]!.b];
  unused.shift();
  while (unused.length) {
    const tip = points[points.length - 1]!;
    const index = unused.findIndex((segment) => same(segment.a, tip) || same(segment.b, tip));
    if (index < 0) break;
    const [segment] = unused.splice(index, 1);
    const next = same(segment!.a, tip) ? segment!.b : segment!.a;
    if (same(next, points[0]!)) return points.length >= 3 ? points : null;
    if (points.some((point) => key(point) === key(next))) continue;
    points.push(next);
  }
  return points.length >= 3 && same(points[0]!, points[points.length - 1]!) ? points.slice(0, -1) : null;
}

export function suggestRoomPolygonFromDwg(
  underlay: LivingRoomPlanUnderlay | null,
  layerNames?: string[],
  region?: DwgSuggestPlanRegion | null,
): Point2Mm[] | null {
  if (!underlay?.dwg) return null;
  return walk(segmentsFrom(underlay, layerNames, region));
}
