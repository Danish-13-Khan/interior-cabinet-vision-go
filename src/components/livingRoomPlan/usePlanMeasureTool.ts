import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject";
import {
  appendMeasurePoint,
  calibrateUnderlayScale,
  collectMeasureSnapPoints,
  parseKnownLengthMm,
  snapMeasurePoint,
  type BuildTool,
  type LivingRoomPlanUnderlay,
  type MeasureSnapPoint,
} from "../../domain/livingRoom";

/** Measure and Calibrate tools: snapped click points, running lengths and the known-length prompt. */
export function usePlanMeasureTool(input: {
  project: InteriorProject;
  tool: BuildTool;
  underlay: LivingRoomPlanUnderlay | null;
  snapSizeMm: number;
  pointerSnapMm: number;
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
  const [snap, setSnap] = useState<MeasureSnapPoint | null>(null);
  const [prompt, setPrompt] = useState<{ a: Point2Mm; b: Point2Mm } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearPoints() {
    setPoints([]);
    setCursor(null);
    setSnap(null);
  }

  useEffect(() => {
    clearPoints();
    setPrompt(null);
    setError(null);
  }, [input.tool, input.project.id, input.project.activeRoomId]);

  const candidates = useMemo(
    () => (active ? collectMeasureSnapPoints(input.project, input.snapSizeMm) : []),
    [active, input.project, input.snapSizeMm],
  );

  function snapped(event: ReactPointerEvent<SVGElement>) {
    const raw = input.worldPoint(event as ReactPointerEvent<SVGSVGElement>);
    const point = snapMeasurePoint(raw, candidates, input.pointerSnapMm, input.snapSizeMm);
    setSnap(point);
    setCursor(point);
    return point;
  }

  function hover(event: ReactPointerEvent<SVGSVGElement>) {
    snapped(event);
  }

  function click(event: ReactPointerEvent<SVGElement>) {
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

  function applyKnownLength(rawValue: string) {
    if (!prompt || !input.underlay || !input.onSetPlanUnderlay) {
      setPrompt(null);
      return;
    }
    try {
      const known = parseKnownLengthMm(rawValue);
      input.onSetPlanUnderlay(calibrateUnderlayScale(input.underlay, prompt.a, prompt.b, known));
      setError(null);
      setPrompt(null);
      clearPoints();
      input.onCalibrateComplete?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calibration failed.");
    }
  }

  function cancelPrompt() {
    setPrompt(null);
    clearPoints();
    setError(null);
  }

  return {
    measuring, calibrating, active, blockedReason, points, cursor, snap, prompt, error,
    clearError: () => setError(null), hover, click, applyKnownLength, cancelPrompt,
  };
}
