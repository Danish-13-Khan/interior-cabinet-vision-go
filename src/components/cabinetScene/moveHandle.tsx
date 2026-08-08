import { useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, Sphere } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import type { CabinetInstance } from "../../domain/cabinetDimensions";
import {
  getFootprintDimensions,
  snapMillimetresToGrid,
} from "../../domain/cabinetDimensions";
import type { MoveHandleProps } from "./types";
import { getCabinetWorldCenter } from "./worldCoords";

function smartSnap(value: number, myWidth: number, targets: { x: number; w: number }[], grid: number): number {
  let best = value;

  best = snapMillimetresToGrid(best, grid);

  const ALIGN_THRESHOLD = 25;
  for (const t of targets) {
    if (Math.abs(best - myWidth / 2 - (t.x - t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x - t.w / 2 + myWidth / 2;
    if (Math.abs(best + myWidth / 2 - (t.x + t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x + t.w / 2 - myWidth / 2;
    if (Math.abs(best - myWidth / 2 - (t.x + t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x + t.w / 2 + myWidth / 2;
    if (Math.abs(best + myWidth / 2 - (t.x - t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x - t.w / 2 - myWidth / 2;
  }

  return best;
}


export function MoveHandle({
  cabinet,
  roomDimensions,
  snapSizeMm,
  allCabinets,
  onMove,
  onDragStateChange,
}: MoveHandleProps) {
  const dragPlaneRef = useRef<Plane | null>(null);
  const dragOffsetRef = useRef(new Vector3());
  const pointerRef = useRef(new Vector3());
  const dragStartedRef = useRef(false);
  const startScreenRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const center = getCabinetWorldCenter(cabinet);
  const centerVec = useMemo(() => new Vector3(...center), [center]);
  const DEAD_ZONE_PX = 5;

  function getDragPlane(attachment: CabinetInstance["placement"]["attachment"]): Plane {
    const halfDepthM = roomDimensions.depthMm / 2000;
    const halfWidthM = roomDimensions.widthMm / 2000;
    switch (attachment) {
      case "floor": return new Plane(new Vector3(0, 1, 0), 0);
      case "back-wall": return new Plane(new Vector3(0, 0, 1), halfDepthM);
      case "left-wall": return new Plane(new Vector3(1, 0, 0), halfWidthM);
      case "right-wall": return new Plane(new Vector3(1, 0, 0), -halfWidthM);
    }
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const ne = event.nativeEvent as PointerEvent;
    startScreenRef.current = { x: ne.clientX, y: ne.clientY };
    dragStartedRef.current = false;
    dragPlaneRef.current = getDragPlane(cabinet.placement.attachment);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!dragPlaneRef.current) return;
    const ne = event.nativeEvent as PointerEvent;

    if (!dragStartedRef.current) {
      const dx = ne.clientX - startScreenRef.current.x;
      const dy = ne.clientY - startScreenRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < DEAD_ZONE_PX) return;
      const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);
      if (hitPoint) dragOffsetRef.current.copy(centerVec).sub(hitPoint);
      dragStartedRef.current = true;
      setIsDragging(true);
      onDragStateChange?.(true);
      if ((ne.target as HTMLElement)?.setPointerCapture) {
        (ne.target as HTMLElement).setPointerCapture(ne.pointerId);
      }
    }

    event.stopPropagation();
    const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);
    if (!hitPoint) return;

    const wx = hitPoint.x + dragOffsetRef.current.x;
    const wy = hitPoint.y + dragOffsetRef.current.y;
    const wz = hitPoint.z + dragOffsetRef.current.z;
    const attachment = cabinet.placement.attachment;
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);

    let cx = wx * 1000;
    let cz = wz * 1000;
    let cy = wy * 1000;

    const others = allCabinets ? allCabinets.filter(c => c.id !== cabinet.id) : [];
    cx = smartSnap(cx, fp.width, others.map(o => ({ x: o.placement.x, w: getFootprintDimensions(o.config.dimensions, o.placement.rotation).width })), snapSizeMm);
    cz = smartSnap(cz, fp.depth, others.map(o => ({ x: o.placement.z, w: getFootprintDimensions(o.config.dimensions, o.placement.rotation).depth })), snapSizeMm);

    const hw = roomDimensions.widthMm / 2;
    const hd = roomDimensions.depthMm / 2;
    const wallThreshold = 120;
    if (Math.abs(cx - fp.width / 2 - (-hw)) < wallThreshold) cx = -hw + fp.width / 2;
    if (Math.abs(cx + fp.width / 2 - hw) < wallThreshold) cx = hw - fp.width / 2;
    if (Math.abs(cz - fp.depth / 2 - (-hd)) < wallThreshold) cz = -hd + fp.depth / 2;
    if (Math.abs(cz + fp.depth / 2 - hd) < wallThreshold) cz = hd - fp.depth / 2;

    if (attachment === "floor") {
      onMove({
        ...cabinet.placement,
        x: snapMillimetresToGrid(cx, snapSizeMm),
        y: 0,
        z: snapMillimetresToGrid(cz, snapSizeMm),
      });
    } else if (attachment === "back-wall") {
      onMove({
        ...cabinet.placement,
        x: snapMillimetresToGrid(cx, snapSizeMm),
        y: snapMillimetresToGrid(Math.max(0, cy), snapSizeMm),
      });
    } else {
      onMove({
        ...cabinet.placement,
        y: snapMillimetresToGrid(Math.max(0, cy), snapSizeMm),
        z: snapMillimetresToGrid(cz, snapSizeMm),
      });
    }
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    dragPlaneRef.current = null;
    if (dragStartedRef.current) {
      dragStartedRef.current = false;
      setIsDragging(false);
      onDragStateChange?.(false);
      const ne = event.nativeEvent as PointerEvent;
      if ((ne.target as HTMLElement)?.releasePointerCapture) {
        (ne.target as HTMLElement).releasePointerCapture(ne.pointerId);
      }
    }
  }

  return (
    <group position={center}>
      <Sphere
        args={[0.18, 16, 16]}
        renderOrder={1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <meshStandardMaterial
          color={isDragging ? "#5b8def" : "#92abca"}
          roughness={0.25}
          emissive={isDragging ? "#295fc7" : "#000000"}
          emissiveIntensity={isDragging ? 0.3 : 0}
          depthTest={false}
          depthWrite={false}
        />
      </Sphere>
      <Html center>
        <span className="move-badge">Move</span>
      </Html>
    </group>
  );
}
