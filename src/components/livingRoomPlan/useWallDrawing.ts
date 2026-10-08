import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point2Mm } from "../../domain/interiorProject";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";
import { usePlanSnap, type PlanSnapInput } from "./usePlanSnap";

function distance(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** A wall shorter than this is a slip, not a segment. */
const MIN_DRAWN_WALL_MM = 100;

export function useWallDrawing(input: PlanSnapInput & {
  active: boolean;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point2Mm;
  onCommit: (start: Point2Mm, end: Point2Mm) => void;
}) {
  const [start, setStart] = useState<Point2Mm | null>(null);
  const [cursor, setCursor] = useState<Point2Mm | null>(null);
  const [snap, setSnap] = useState<PlanSnapResult | null>(null);
  const startRef = useRef<Point2Mm | null>(null);
  const onCommitRef = useRef(input.onCommit);
  onCommitRef.current = input.onCommit;
  const engine = usePlanSnap(input);

  function snapped(event: ReactPointerEvent<Element>): PlanSnapResult {
    return engine.snap(input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>), event);
  }

  /** Begin from paper or wall geometry — capture on the SVG root so drag keeps streaming. */
  function begin(event: ReactPointerEvent<Element>) {
    if (!input.active || event.button !== 0) return false;
    event.stopPropagation();
    const svg = ((event.currentTarget as SVGElement).ownerSVGElement ?? event.currentTarget) as Element;
    svg.setPointerCapture?.(event.pointerId);
    const result = snapped(event);
    startRef.current = result.point;
    setStart(result.point);
    setCursor(result.point);
    setSnap(result);
    return true;
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!input.active || !startRef.current) return false;
    const result = snapped(event);
    setCursor(result.point);
    setSnap(result);
    return true;
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    const origin = startRef.current;
    if (!input.active || !origin) return false;
    const end = snapped(event).point;
    if (distance(origin, end) >= Math.max(input.gridMm * 2, MIN_DRAWN_WALL_MM)) {
      onCommitRef.current(origin, end);
    }
    startRef.current = null;
    setStart(null);
    setCursor(null);
    setSnap(null);
    return true;
  }

  const preview = start && cursor ? [start, cursor] as const : null;
  return { preview, snap, begin, move, finish };
}
