import type { Point2Mm } from "../../interiorProject";
import { collectPlanSnapCandidates, snapWallsForContext } from "./collect";
import { PLAN_SNAP_PRIORITY, type PlanSnapCandidate, type PlanSnapContext, type PlanSnapKind, type PlanSnapResult } from "./types";

/** Angle tolerance for the automatic horizontal / vertical axis snap (roadmap S3). */
export const PLAN_AXIS_SNAP_DEGREES = 2;

function allowed(ctx: PlanSnapContext, kind: PlanSnapKind): boolean {
  return !ctx.allow || ctx.allow.includes(kind);
}

function candidate(kind: PlanSnapKind, point: Point2Mm, label: string, sourceId?: string): PlanSnapCandidate {
  return { kind, point: { x: point.x, z: point.z }, label, sourceId, priority: PLAN_SNAP_PRIORITY[kind] };
}

/** Nearest point candidate within the threshold; equally near candidates fall back to priority. */
export function nearestPlanSnapCandidate(
  candidates: readonly PlanSnapCandidate[],
  pointer: Point2Mm,
  thresholdMm: number,
): PlanSnapCandidate | null {
  let best: PlanSnapCandidate | null = null;
  let bestDistance = thresholdMm;
  for (const item of candidates) {
    const distance = Math.hypot(item.point.x - pointer.x, item.point.z - pointer.z);
    if (distance > bestDistance) continue;
    if (!best || distance < bestDistance - 0.01 || (Math.abs(distance - bestDistance) <= 0.01 && item.priority < best.priority)) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

type AxisLock = { value: number; candidate: PlanSnapCandidate } | null;

function nearestGuide(ctx: PlanSnapContext, axis: "x" | "z", value: number, thresholdMm: number): AxisLock {
  if (!allowed(ctx, "guide")) return null;
  let best: AxisLock = null;
  let bestDistance = thresholdMm;
  for (const guide of ctx.guides ?? []) {
    if (guide.axis !== axis) continue;
    const distance = Math.abs(guide.positionMm - value);
    if (distance > bestDistance) continue;
    bestDistance = distance;
    const label = guide.label ? `Guide ${guide.label}` : "Guide";
    best = { value: guide.positionMm, candidate: candidate("guide", { x: 0, z: 0 }, label, guide.id) };
  }
  return best;
}

function onWall(ctx: PlanSnapContext, pointer: Point2Mm, thresholdMm: number): PlanSnapCandidate | null {
  if (!allowed(ctx, "on-wall")) return null;
  let best: PlanSnapCandidate | null = null;
  let bestDistance = thresholdMm;
  for (const wall of snapWallsForContext(ctx)) {
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq < 1e-9) continue;
    const t = ((pointer.x - wall.start.x) * dx + (pointer.z - wall.start.z) * dz) / lengthSq;
    if (t <= 0 || t >= 1) continue;
    const point = { x: wall.start.x + dx * t, z: wall.start.z + dz * t };
    const distance = Math.hypot(point.x - pointer.x, point.z - pointer.z);
    if (distance > bestDistance) continue;
    bestDistance = distance;
    best = candidate("on-wall", point, "On wall", wall.id);
  }
  return best;
}

/**
 * Snap a pointer. Point candidates win when one is within the threshold;
 * otherwise the pointer is pulled, axis by axis, onto the segment axis through
 * the anchor, the nearest wall, user guides, and finally the grid. Every
 * line-like kind, the grid included, only pulls within the pick radius, so a
 * pointer far from any grid line stays free; calibrate disables the grid
 * through `gridMm: 0` and `allow: ["dwg-end"]`.
 */
export function pickPlanSnap(
  ctx: PlanSnapContext,
  pointer: Point2Mm,
  thresholdMm: number,
  candidates: readonly PlanSnapCandidate[] = collectPlanSnapCandidates(ctx, thresholdMm),
): PlanSnapResult {
  let xLock: AxisLock = null;
  let zLock: AxisLock = null;

  if (ctx.anchor && ctx.axisLock) {
    // Hard lock: project onto the dominant axis first; only candidates on that axis may still win.
    const horizontal = Math.abs(pointer.x - ctx.anchor.x) >= Math.abs(pointer.z - ctx.anchor.z);
    const projected = horizontal ? { x: pointer.x, z: ctx.anchor.z } : { x: ctx.anchor.x, z: pointer.z };
    const anchor = ctx.anchor;
    const onAxis = candidates.filter((item) =>
      horizontal ? Math.abs(item.point.z - anchor.z) < 0.5 : Math.abs(item.point.x - anchor.x) < 0.5);
    const nearestOnAxis = nearestPlanSnapCandidate(onAxis, projected, thresholdMm);
    if (nearestOnAxis) return { point: { ...nearestOnAxis.point }, candidate: nearestOnAxis };
    if (horizontal) zLock = { value: anchor.z, candidate: candidate("axis-h", { x: 0, z: 0 }, "Horizontal") };
    else xLock = { value: anchor.x, candidate: candidate("axis-v", { x: 0, z: 0 }, "Vertical") };
  } else {
    const nearest = nearestPlanSnapCandidate(candidates, pointer, thresholdMm);
    if (nearest) return { point: { ...nearest.point }, candidate: nearest };
  }

  if (ctx.anchor && !ctx.axisLock) {
    const dx = pointer.x - ctx.anchor.x;
    const dz = pointer.z - ctx.anchor.z;
    const length = Math.hypot(dx, dz);
    const tolerance = Math.max(thresholdMm, length * Math.tan(PLAN_AXIS_SNAP_DEGREES * Math.PI / 180));
    if (length > thresholdMm) {
      if (allowed(ctx, "axis-h") && Math.abs(dz) <= tolerance && Math.abs(dx) > Math.abs(dz)) {
        zLock = { value: ctx.anchor.z, candidate: candidate("axis-h", { x: 0, z: 0 }, "Horizontal") };
      } else if (allowed(ctx, "axis-v") && Math.abs(dx) <= tolerance && Math.abs(dz) > Math.abs(dx)) {
        xLock = { value: ctx.anchor.x, candidate: candidate("axis-v", { x: 0, z: 0 }, "Vertical") };
      }
    }
  }

  if (!xLock && !zLock) {
    const wall = onWall(ctx, pointer, thresholdMm);
    if (wall) return { point: { ...wall.point }, candidate: wall };
  }

  if (!xLock) xLock = nearestGuide(ctx, "x", pointer.x, thresholdMm);
  if (!zLock) zLock = nearestGuide(ctx, "z", pointer.z, thresholdMm);

  const gridOn = ctx.gridMm > 0 && allowed(ctx, "grid");
  const gridLock = (value: number): AxisLock => {
    if (!gridOn) return null;
    const rounded = Math.round(value / ctx.gridMm) * ctx.gridMm;
    if (Math.abs(rounded - value) > thresholdMm) return null;
    return { value: rounded, candidate: candidate("grid", { x: 0, z: 0 }, "Grid") };
  };
  if (!xLock) xLock = gridLock(pointer.x);
  if (!zLock) zLock = gridLock(pointer.z);

  const point = { x: xLock?.value ?? pointer.x, z: zLock?.value ?? pointer.z };
  const locks = [xLock, zLock].filter((lock): lock is NonNullable<AxisLock> => lock !== null);
  if (locks.length === 0) return { point, candidate: null };
  const primary = locks.reduce((best, lock) => (lock.candidate.priority < best.candidate.priority ? lock : best));
  const label = xLock && zLock && xLock.candidate.kind === "guide" && zLock.candidate.kind === "guide"
    ? `${xLock.candidate.label} × ${zLock.candidate.label.replace(/^Guide ?/, "")}`.trim()
    : primary.candidate.label;
  return { point, candidate: { ...primary.candidate, point, label } };
}
