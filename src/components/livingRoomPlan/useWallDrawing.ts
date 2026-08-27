import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { snapPlanPoint, type Point2Mm, type PlanNodeEntity } from "../../domain/interiorProject";

function distance(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function useWallDrawing(input: {
  active: boolean;
  snapSizeMm: number;
  nodes: PlanNodeEntity[];
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point2Mm;
  onCommit: (start: Point2Mm, end: Point2Mm) => void;
}) {
  const [start, setStart] = useState<Point2Mm | null>(null);
  const [cursor, setCursor] = useState<Point2Mm | null>(null);
  const startRef = useRef<Point2Mm | null>(null);
  const onCommitRef = useRef(input.onCommit);
  onCommitRef.current = input.onCommit;

  function snap(point: Point2Mm) {
    return snapPlanPoint(point, input.snapSizeMm, input.nodes);
  }

  function begin(event: ReactPointerEvent<SVGRectElement>) {
    if (!input.active || event.button !== 0) return false;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = snap(input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>));
    startRef.current = point;
    setStart(point);
    setCursor(point);
    return true;
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!input.active || !startRef.current) return false;
    setCursor(snap(input.worldPoint(event)));
    return true;
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    const origin = startRef.current;
    if (!input.active || !origin) return false;
    const end = snap(input.worldPoint(event));
    if (distance(origin, end) >= input.snapSizeMm * 2) {
      onCommitRef.current(origin, end);
    }
    startRef.current = null;
    setStart(null);
    setCursor(null);
    return true;
  }

  const preview = start && cursor ? [start, cursor] as const : null;
  return { preview, begin, move, finish };
}
