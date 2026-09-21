import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import type { Point2Mm } from "../interiorProject";
import type { DwgSuggestPlanRegion } from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

export type DwgSuggestHighlightStroke = {
  layer: string;
  points: Point2Mm[];
  candidateId?: string;
  accepted?: boolean;
  closed?: boolean;
  overlap?: "none" | "covered" | "partial";
};

/** Plan polylines for extracted straight centerlines (curves omitted). */
export function dwgSuggestHighlightStrokes(
  underlay: LivingRoomPlanUnderlay | null,
  requestedLayers?: readonly string[] | null,
  region?: DwgSuggestPlanRegion | null,
): DwgSuggestHighlightStroke[] {
  return extractDwgSuggestCenterlines(underlay, requestedLayers, region).segments.map((segment) => ({
    layer: segment.layer,
    points: [segment.a, segment.b],
  }));
}
