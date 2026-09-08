import { type ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import { Plane, Vector3 } from "three";
import type { Point3Mm } from "../../domain/interiorProject";

const FLOOR_DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0);

type DragState = {
  pointerId: number;
  startPoint: Vector3;
  startPosition: Point3Mm;
};

export function useCompiledNodeDrag(
  snapSizeMm: number,
  startPosition: Point3Mm,
  sourceObjectId: string | null,
  onMove: (objectId: string, position: Point3Mm) => void,
  onDragStateChange: (dragging: boolean) => void,
) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Point3Mm | null>(null);

  function groundPoint(event: ThreeEvent<PointerEvent>) {
    const result = new Vector3();
    return event.ray.intersectPlane(FLOOR_DRAG_PLANE, result) ? result : null;
  }

  function beginDrag(event: ThreeEvent<PointerEvent>) {
    const point = groundPoint(event);
    if (!point || event.shiftKey || event.metaKey || event.ctrlKey) return;
    (event.nativeEvent.target as Element | null)?.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, startPoint: point, startPosition });
    setPreview({ ...startPosition });
    onDragStateChange(true);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = groundPoint(event);
    if (!point) return;
    setPreview({
      ...drag.startPosition,
      x: Math.round((drag.startPosition.x + (point.x - drag.startPoint.x) * 1000) / snapSizeMm) * snapSizeMm,
      z: Math.round((drag.startPosition.z + (point.z - drag.startPoint.z) * 1000) / snapSizeMm) * snapSizeMm,
    });
  }

  function finishDrag(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId || !sourceObjectId) return;
    event.stopPropagation();
    (event.nativeEvent.target as Element | null)?.releasePointerCapture(event.pointerId);
    if (preview && (preview.x !== drag.startPosition.x || preview.z !== drag.startPosition.z)) {
      onMove(sourceObjectId, preview);
    }
    setDrag(null);
    setPreview(null);
    onDragStateChange(false);
  }

  return { preview, beginDrag, handlePointerMove, finishDrag };
}
