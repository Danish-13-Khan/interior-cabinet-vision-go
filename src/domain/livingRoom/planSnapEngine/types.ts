import type { InteriorProject, Point2Mm } from "../../interiorProject";
import type { PlanGuide } from "../planGuides/planGuides";

/**
 * One snap engine for every plan tool (roadmap S1). Point kinds are collected
 * once per project; line-like kinds (axis, on-wall, guide, grid) depend on the
 * pointer and are resolved in `pickPlanSnap`.
 */
export type PlanSnapKind =
  | "node"
  | "dwg-end"
  | "intersection"
  | "midpoint"
  | "on-wall"
  | "opening-edge"
  | "opening-centre"
  | "cabinet-edge"
  | "cabinet-centre"
  | "guide"
  | "axis-h"
  | "axis-v"
  | "grid";

export type PlanSnapCandidate = {
  kind: PlanSnapKind;
  point: Point2Mm;
  /** Shown beside the marker: "Node", "Wall midpoint", "Horizontal". */
  label: string;
  /** Wall / node / opening / guide id the candidate came from. */
  sourceId?: string;
  /** Tie-break between equally near candidates; lower wins. */
  priority: number;
};

export type PlanSnapContext = {
  project: InteriorProject;
  /** Room that scopes opening and cabinet candidates. Defaults to the active room. */
  roomId?: string | null;
  dwgEndpoints?: readonly Point2Mm[];
  guides?: readonly PlanGuide[];
  /** Grid step in mm; 0 disables the grid fallback. */
  gridMm: number;
  /** Segment start: enables the horizontal / vertical axis candidates. */
  anchor?: Point2Mm | null;
  /** Shift held: force the dominant axis through the anchor regardless of angle (roadmap S3). */
  axisLock?: boolean;
  /** The thing being dragged, so it cannot snap to itself. */
  exclude?: { nodeIds?: readonly string[]; wallIds?: readonly string[] };
  /** Restrict to these kinds; the calibrate tool passes ["dwg-end"]. */
  allow?: readonly PlanSnapKind[];
};

export type PlanSnapResult = {
  point: Point2Mm;
  /** Null when nothing snapped and the point is the raw pointer. */
  candidate: PlanSnapCandidate | null;
};

/** Roadmap S2: node > DWG endpoint > intersection > midpoint > on-wall > guide > grid. */
export const PLAN_SNAP_PRIORITY: Record<PlanSnapKind, number> = {
  node: 0,
  "dwg-end": 1,
  intersection: 2,
  midpoint: 3,
  "opening-centre": 4,
  "opening-edge": 5,
  "cabinet-centre": 6,
  "cabinet-edge": 7,
  "axis-h": 8,
  "axis-v": 8,
  "on-wall": 9,
  guide: 10,
  grid: 11,
};

/** Point candidates: fixed positions that can be collected once per project. */
export const PLAN_SNAP_POINT_KINDS: readonly PlanSnapKind[] = [
  "node", "dwg-end", "intersection", "midpoint", "opening-centre", "opening-edge", "cabinet-centre", "cabinet-edge",
];
