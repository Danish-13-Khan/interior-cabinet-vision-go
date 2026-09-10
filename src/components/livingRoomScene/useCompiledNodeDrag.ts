import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Plane, Vector3 } from "three";
import type { Point3Mm } from "../../domain/interiorProject";

const FLOOR_DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0);
/** Ignore micro-moves so click-select does not disable OrbitControls. */
const DRAG_DEAD_ZONE_M = 0.012;

type DragState = {
  pointerId: number;
  startPoint: Vector3;
  startPosition: Point3Mm;
  moved: boolean;
};

export function useCompiledNodeDrag(
  snapSizeMm: number,
  startPosition: Point3Mm,
  sourceObjectId: string | null,
  onMove: (objectId: string, position: Point3Mm) => void,
  onDragStateChange: (dragging: boolean) => void,
) {
  const [preview, setPreview] = useState<Point3Mm | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<Point3Mm | null>(null);
  const sourceIdRef = useRef(sourceObjectId);
  const onMoveRef = useRef(onMove);
  const onDragStateRef = useRef(onDragStateChange);
  sourceIdRef.current = sourceObjectId;
  onMoveRef.current = onMove;
  onDragStateRef.current = onDragStateChange;

  function groundPoint(ray: ThreeEvent<PointerEvent>["ray"]) {
    const result = new Vector3();
    return ray.intersectPlane(FLOOR_DRAG_PLANE, result) ? result : null;
  }

  function clearDrag(releaseTarget: Element | null, pointerId: number | null) {
    if (releaseTarget && pointerId !== null) {
      try {
        releaseTarget.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    }
    const wasDragging = Boolean(dragRef.current?.moved);
    dragRef.current = null;
    previewRef.current = null;
    setPreview(null);
    if (wasDragging) onDragStateRef.current(false);
  }

  function beginDrag(event: ThreeEvent<PointerEvent>) {
    const point = groundPoint(event.ray);
    if (!point || event.shiftKey || event.metaKey || event.ctrlKey) return;
    const target = event.nativeEvent.target as Element | null;
    target?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startPoint: point,
      startPosition,
      moved: false,
    };
    previewRef.current = { ...startPosition };
    setPreview({ ...startPosition });
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = groundPoint(event.ray);
    if (!point) return;
    const dxM = point.x - drag.startPoint.x;
    const dzM = point.z - drag.startPoint.z;
    if (!drag.moved && Math.hypot(dxM, dzM) < DRAG_DEAD_ZONE_M) return;
    if (!drag.moved) {
      drag.moved = true;
      onDragStateRef.current(true);
    }
    const next = {
      ...drag.startPosition,
      x: Math.round((drag.startPosition.x + dxM * 1000) / snapSizeMm) * snapSizeMm,
      z: Math.round((drag.startPosition.z + dzM * 1000) / snapSizeMm) * snapSizeMm,
    };
    previewRef.current = next;
    setPreview(next);
  }

  function finishDrag(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const objectId = sourceIdRef.current;
    const previewPose = previewRef.current;
    if (
      drag.moved
      && objectId
      && previewPose
      && (previewPose.x !== drag.startPosition.x || previewPose.z !== drag.startPosition.z)
    ) {
      onMoveRef.current(objectId, previewPose);
    }
    clearDrag(event.nativeEvent.target as Element | null, event.pointerId);
  }

  useEffect(() => {
    function onWindowEnd(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const objectId = sourceIdRef.current;
      const previewPose = previewRef.current;
      if (
        drag.moved
        && objectId
        && previewPose
        && (previewPose.x !== drag.startPosition.x || previewPose.z !== drag.startPosition.z)
      ) {
        onMoveRef.current(objectId, previewPose);
      }
      clearDrag(event.target as Element | null, event.pointerId);
    }
    window.addEventListener("pointerup", onWindowEnd);
    window.addEventListener("pointercancel", onWindowEnd);
    return () => {
      window.removeEventListener("pointerup", onWindowEnd);
      window.removeEventListener("pointercancel", onWindowEnd);
      if (dragRef.current?.moved) onDragStateRef.current(false);
      dragRef.current = null;
      previewRef.current = null;
    };
  }, []);

  return { preview, beginDrag, handlePointerMove, finishDrag };
}
