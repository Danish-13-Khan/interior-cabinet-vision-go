import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { rectanglePoints, type Point2Mm, type RoomDrawingRequest } from "../../domain/interiorProject";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";
import { usePlanSnap, type PlanSnapInput } from "./usePlanSnap";

type Point = Point2Mm;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** A drag shorter than this adds a polygon vertex instead of a rectangle. */
const MIN_RECTANGLE_MM = 150;

export function useRoomDrawing(input: PlanSnapInput & {
  active: boolean; closeRequest: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point;
  onCommit: (drawing: RoomDrawingRequest) => void;
  onPointCount: (count: number) => void;
}) {
  const engine = usePlanSnap(input);
  const snapAt = (event: ReactPointerEvent<Element>): PlanSnapResult =>
    engine.snap(input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>), event);
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [rectangleStart, setRectangleStart] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [snap, setSnap] = useState<PlanSnapResult | null>(null);
  const startRef = useRef<Point | null>(null);
  const onCommitRef = useRef(input.onCommit);
  const onPointCountRef = useRef(input.onPointCount);
  onCommitRef.current = input.onCommit;
  onPointCountRef.current = input.onPointCount;

  useEffect(() => { onPointCountRef.current(polygon.length); }, [polygon.length]);
  useEffect(() => {
    if (input.active) return;
    startRef.current = null;
    setRectangleStart(null); setCursor(null); setSnap(null); setPolygon([]);
  }, [input.active]);
  useEffect(() => {
    if (!input.closeRequest || polygon.length < 3) return;
    onCommitRef.current({ kind: "polygon", points: polygon });
    setPolygon([]); setCursor(null); setSnap(null);
  }, [input.closeRequest, polygon]);

  function start(event: ReactPointerEvent<SVGRectElement>) {
    if (!input.active || event.button !== 0) return false;
    event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    const result = snapAt(event);
    startRef.current = result.point; setRectangleStart(result.point); setCursor(result.point); setSnap(result);
    return true;
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!input.active || (!startRef.current && polygon.length === 0)) return false;
    const result = snapAt(event);
    setCursor(result.point); setSnap(result);
    return true;
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    const startPoint = startRef.current;
    if (!input.active || !startPoint) return false;
    const end = snapAt(event).point;
    if (distance(startPoint, end) >= Math.max(input.gridMm * 3, MIN_RECTANGLE_MM)) {
      onCommitRef.current({ kind: "rectangle", points: rectanglePoints(startPoint, end) });
      setPolygon([]);
    } else {
      setPolygon((points) => [...points, startPoint]);
    }
    startRef.current = null; setRectangleStart(null); setCursor(null); setSnap(null);
    return true;
  }

  function cancel() {
    startRef.current = null; setRectangleStart(null); setCursor(null); setSnap(null); setPolygon([]);
  }

  const rectangle = rectangleStart && cursor ? rectanglePoints(rectangleStart, cursor) : null;
  return { polygon, rectangle, cursor, snap, start, move, finish, cancel };
}
