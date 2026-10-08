import { useMemo } from "react";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject";
import type { PlanGuide } from "../../domain/livingRoom/planGuides";
import {
  collectPlanSnapCandidates,
  pickPlanSnap,
  type PlanSnapContext,
  type PlanSnapKind,
  type PlanSnapResult,
} from "../../domain/livingRoom/planSnapEngine";

/** Shared inputs every plan tool passes to the snap engine (roadmap S1). */
export type PlanSnapInput = {
  project: InteriorProject;
  dwgEndpoints?: readonly Point2Mm[];
  guides?: readonly PlanGuide[];
  /** Grid step in mm. */
  gridMm: number;
  /** Zoom-aware pick radius in mm (8 screen px). */
  thresholdMm: number;
  /** Toolbar Snap toggle; off means the raw pointer everywhere. */
  snapEnabled?: boolean;
};

export type PlanSnapPointer = { altKey?: boolean; shiftKey?: boolean };

/**
 * Memoises the fixed candidates for the project and returns a `snap(raw, event, extra)`
 * that applies the engine, or the raw pointer when snapping is off or Alt is held.
 */
export function usePlanSnap(input: PlanSnapInput, options: {
  exclude?: PlanSnapContext["exclude"];
  allow?: readonly PlanSnapKind[];
  roomId?: string | null;
} = {}) {
  const excludeKey = JSON.stringify(options.exclude ?? null);
  const allowKey = options.allow ? options.allow.join(",") : "";
  const exclude = useMemo(
    () => (excludeKey === "null" ? undefined : JSON.parse(excludeKey) as PlanSnapContext["exclude"]),
    [excludeKey],
  );
  const allow = useMemo(
    () => (allowKey ? allowKey.split(",") as PlanSnapKind[] : undefined),
    [allowKey],
  );
  const roomId = options.roomId;
  const context = useMemo<PlanSnapContext>(() => ({
    project: input.project,
    roomId,
    dwgEndpoints: input.dwgEndpoints,
    guides: input.guides,
    gridMm: input.gridMm,
    exclude,
    allow,
  }), [input.project, input.dwgEndpoints, input.guides, input.gridMm, exclude, allow, roomId]);
  const candidates = useMemo(
    () => collectPlanSnapCandidates(context, input.thresholdMm),
    [context, input.thresholdMm],
  );

  /**
   * `extra.anchor` is the segment start: it enables the automatic axis snap, and
   * Shift on the pointer event turns it into a hard lock (roadmap S3). Alt or the
   * Snap toggle off returns the raw pointer.
   */
  function snap(raw: Point2Mm, pointer?: PlanSnapPointer, extra?: { anchor?: Point2Mm | null }): PlanSnapResult {
    if (input.snapEnabled === false || pointer?.altKey) {
      if (extra?.anchor && pointer?.shiftKey) {
        const horizontal = Math.abs(raw.x - extra.anchor.x) >= Math.abs(raw.z - extra.anchor.z);
        return { point: horizontal ? { x: raw.x, z: extra.anchor.z } : { x: extra.anchor.x, z: raw.z }, candidate: null };
      }
      return { point: raw, candidate: null };
    }
    const ctx = extra?.anchor ? { ...context, anchor: extra.anchor, axisLock: Boolean(pointer?.shiftKey) } : context;
    return pickPlanSnap(ctx, raw, input.thresholdMm, candidates);
  }

  return { snap, candidates };
}
