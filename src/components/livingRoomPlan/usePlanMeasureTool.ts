import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject";
import {
  appendMeasurePoint,
  calibrateUnderlayScale,
  calibrateUnderlayToAxis,
  calibrateUnderlayToWall,
  parseKnownLengthMm,
  type BuildTool,
  type LivingRoomPlanUnderlay,
} from "../../domain/livingRoom";
import type { PlanSnapKind, PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";
import type { CalibrateUnderlayRequest } from "./CalibrateUnderlayDialog";
import { usePlanSnap, type PlanSnapInput } from "./usePlanSnap";

/** Calibration must read the picture, not the plan: only CAD endpoints may snap (roadmap S6). */
const CALIBRATE_SNAP_KINDS: readonly PlanSnapKind[] = ["dwg-end"];

/**
 * Measure and Calibrate tools: snapped click points, running lengths, the
 * known-length prompt (with the axis and lock options) and Align to wall.
 */
export function usePlanMeasureTool(input: Omit<PlanSnapInput, "gridMm"> & {
  project: InteriorProject;
  tool: BuildTool;
  underlay: LivingRoomPlanUnderlay | null;
  snapSizeMm: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point2Mm;
  onSetPlanUnderlay?: (underlay: LivingRoomPlanUnderlay | null) => void;
  onCalibrateComplete?: () => void;
}) {
  const measuring = input.tool === "measure";
  const calibrating = input.tool === "calibrate-underlay";
  const active = measuring || calibrating;
  const blockedReason = !calibrating ? null
    : !input.underlay ? "Import a floor plan underlay before calibrating."
    : input.underlay.locked ? "Unlock the underlay before calibrating."
    : null;

  const [points, setPoints] = useState<Point2Mm[]>([]);
  const [cursor, setCursor] = useState<Point2Mm | null>(null);
  const [snap, setSnap] = useState<PlanSnapResult | null>(null);
  const [prompt, setPrompt] = useState<{ a: Point2Mm; b: Point2Mm } | null>(null);
  /** After "Align to a drawn wall": the next wall click finishes the calibration. */
  const [awaitingWall, setAwaitingWall] = useState<{ a: Point2Mm; b: Point2Mm; lockAfter: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calibrate: DWG endpoints only and no grid, so a raster reads the raw pointer.
  const engine = usePlanSnap(
    { ...input, gridMm: calibrating ? 0 : input.snapSizeMm },
    { allow: calibrating ? CALIBRATE_SNAP_KINDS : undefined },
  );

  function clearPoints() {
    setPoints([]);
    setCursor(null);
    setSnap(null);
  }

  useEffect(() => {
    clearPoints();
    setPrompt(null);
    setAwaitingWall(null);
    setError(null);
  }, [input.tool, input.project.id, input.project.activeRoomId]);

  function snapped(event: ReactPointerEvent<SVGElement>) {
    const raw = input.worldPoint(event as ReactPointerEvent<SVGSVGElement>);
    const result = engine.snap(raw, event);
    setSnap(result);
    setCursor(result.point);
    return result.point;
  }

  function hover(event: ReactPointerEvent<SVGSVGElement>) {
    if (!active || awaitingWall) return;
    snapped(event);
  }

  function click(event: ReactPointerEvent<SVGElement>) {
    // While waiting for a wall, let the click reach the wall line.
    if (awaitingWall) return;
    event.preventDefault();
    event.stopPropagation();
    if (calibrating && (blockedReason || prompt)) return;
    const point = snapped(event);
    setPoints((current) => {
      const next = appendMeasurePoint(current, point);
      if (calibrating && next.length >= 2) {
        const a = next[0]!;
        const b = next[1]!;
        setPrompt({ a, b });
        return [a, b];
      }
      return next;
    });
  }

  function commit(underlay: LivingRoomPlanUnderlay, lockAfter: boolean) {
    input.onSetPlanUnderlay?.(lockAfter ? { ...underlay, locked: true } : underlay);
    setError(null);
    setPrompt(null);
    setAwaitingWall(null);
    clearPoints();
    input.onCalibrateComplete?.();
  }

  function applyKnownLength(request: CalibrateUnderlayRequest) {
    if (!prompt || !input.underlay || !input.onSetPlanUnderlay) {
      setPrompt(null);
      return;
    }
    try {
      const known = parseKnownLengthMm(request.knownLength);
      const next = request.axis === "leave"
        ? calibrateUnderlayScale(input.underlay, prompt.a, prompt.b, known)
        : calibrateUnderlayToAxis(input.underlay, prompt.a, prompt.b, known, request.axis);
      commit(next, request.lockAfter);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calibration failed.");
    }
  }

  function startAlignToWall(lockAfter: boolean) {
    if (!prompt) return;
    setAwaitingWall({ ...prompt, lockAfter });
    setPrompt(null);
    setError(null);
  }

  function pickWall(wallId: string) {
    if (!awaitingWall || !input.underlay || !input.onSetPlanUnderlay) return;
    const wall = input.project.walls.find((item) => item.id === wallId);
    if (!wall) return;
    try {
      commit(calibrateUnderlayToWall(input.underlay, awaitingWall.a, awaitingWall.b, wall.start, wall.end), awaitingWall.lockAfter);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calibration failed.");
      setAwaitingWall(null);
      clearPoints();
    }
  }

  function cancelPrompt() {
    setPrompt(null);
    setAwaitingWall(null);
    clearPoints();
    setError(null);
  }

  return {
    measuring, calibrating, active, blockedReason, points, cursor, snap, prompt, error,
    awaitingWall: Boolean(awaitingWall),
    clearError: () => setError(null), hover, click, applyKnownLength, startAlignToWall, pickWall, cancelPrompt,
  };
}
