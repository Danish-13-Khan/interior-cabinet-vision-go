import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { rectanglePoints, type Point2Mm, type RoomDrawingRequest } from "../../domain/interiorProject";

type Point = Point2Mm;

function snap(point: Point, size: number): Point {
  return { x: Math.round(point.x / size) * size, z: Math.round(point.z / size) * size };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function useRoomDrawing(input: {
  active: boolean; snapSizeMm: number; closeRequest: number;
  worldPoint: (event: ReactPointerEvent<SVGSVGElement>) => Point;
  onCommit: (drawing: RoomDrawingRequest) => void;
  onPointCount: (count: number) => void;
}) {
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [rectangleStart, setRectangleStart] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const startRef = useRef<Point | null>(null);
  const onCommitRef = useRef(input.onCommit);
  const onPointCountRef = useRef(input.onPointCount);
  onCommitRef.current = input.onCommit;
  onPointCountRef.current = input.onPointCount;

  useEffect(() => { onPointCountRef.current(polygon.length); }, [polygon.length]);
  useEffect(() => {
    if (input.active) return;
    startRef.current = null;
    setRectangleStart(null); setCursor(null); setPolygon([]);
  }, [input.active]);
  useEffect(() => {
    if (!input.closeRequest || polygon.length < 3) return;
    onCommitRef.current({ kind: "polygon", points: polygon });
    setPolygon([]); setCursor(null);
  }, [input.closeRequest, polygon]);

  function start(event: ReactPointerEvent<SVGRectElement>) {
    if (!input.active || event.button !== 0) return false;
    event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    const point = snap(input.worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>), input.snapSizeMm);
    startRef.current = point; setRectangleStart(point); setCursor(point);
    return true;
  }

  function move(event: ReactPointerEvent<SVGSVGElement>) {
    if (!input.active || (!startRef.current && polygon.length === 0)) return false;
    setCursor(snap(input.worldPoint(event), input.snapSizeMm));
    return true;
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    const startPoint = startRef.current;
    if (!input.active || !startPoint) return false;
    const end = snap(input.worldPoint(event), input.snapSizeMm);
    if (distance(startPoint, end) >= input.snapSizeMm * 3) {
      onCommitRef.current({ kind: "rectangle", points: rectanglePoints(startPoint, end) });
      setPolygon([]);
    } else {
      setPolygon((points) => [...points, startPoint]);
    }
    startRef.current = null; setRectangleStart(null); setCursor(null);
    return true;
  }

  function cancel() {
    startRef.current = null; setRectangleStart(null); setCursor(null); setPolygon([]);
  }

  const rectangle = rectangleStart && cursor ? rectanglePoints(rectangleStart, cursor) : null;
  return { polygon, rectangle, cursor, start, move, finish, cancel };
}
