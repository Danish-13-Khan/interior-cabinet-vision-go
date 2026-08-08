import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, Sphere } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import {
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  getFootprintDimensions,
  usesRotatedFootprint,
} from "../../domain/cabinetDimensions";
import type { ResizeAxis, ResizeHandleProps } from "./types";

export function ResizeHandle({ axis, cabinet, onResize }: ResizeHandleProps) {
  const dragPlaneRef = useRef<Plane | null>(null);
  const dragStartRef = useRef<number>(0);
  const startDimensionsRef = useRef(cabinet.config.dimensions);
  const pointerRef = useRef(new Vector3());
  const rotated = usesRotatedFootprint(cabinet.placement.rotation);
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const width = footprint.width / 1000;
  const height = cabinet.config.dimensions.height / 1000;
  const depth = footprint.depth / 1000;
  const cabinetX = cabinet.placement.x / 1000;
  const cabinetZ = cabinet.placement.z / 1000;
  const cabinetY = cabinet.placement.y / 1000 + height / 2;

  const handlePosition: [number, number, number] =
    axis === "width"
      ? rotated
        ? [cabinetX, cabinetY, cabinetZ + width / 2]
        : [cabinetX + width / 2, cabinetY, cabinetZ]
      : axis === "height"
        ? [cabinetX, cabinetY + height / 2, cabinetZ]
        : rotated
          ? [cabinetX + depth / 2, cabinetY, cabinetZ]
          : [cabinetX, cabinetY, cabinetZ + depth / 2];

  const label = axis === "width" ? "W" : axis === "height" ? "H" : "D";

  function getPlane(axisName: ResizeAxis) {
    if (axisName === "height") {
      return new Plane(new Vector3(0, 0, 1), -cabinetZ);
    }

    if (axisName === "width") {
      return rotated
        ? new Plane(new Vector3(1, 0, 0), -cabinetX)
        : new Plane(new Vector3(0, 0, 1), -cabinetZ);
    }

    return rotated
      ? new Plane(new Vector3(0, 0, 1), -cabinetZ)
      : new Plane(new Vector3(1, 0, 0), -cabinetX);
  }

  function getAxisValue(axisName: ResizeAxis, point: Vector3) {
    if (axisName === "height") {
      return point.y;
    }

    if (axisName === "width") {
      return rotated ? point.z : point.x;
    }

    return rotated ? point.x : point.z;
  }

  function updateDimensions(axisName: ResizeAxis, nextAxisValue: number) {
    const startDimensions = startDimensionsRef.current;
    const delta = nextAxisValue - dragStartRef.current;

    if (axisName === "width") {
      onResize({
        ...startDimensions,
        width: clampCabinetWidth((startDimensions.width / 1000 + delta * 2) * 1000),
      });
      return;
    }

    if (axisName === "height") {
      onResize({
        ...startDimensions,
        height: clampCabinetHeight((startDimensions.height / 1000 + delta * 2) * 1000),
      });
      return;
    }

    onResize({
      ...startDimensions,
      depth: clampCabinetDepth((startDimensions.depth / 1000 + delta * 2) * 1000),
    });
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    dragPlaneRef.current = getPlane(axis);
    startDimensionsRef.current = cabinet.config.dimensions;
    const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);

    if (hitPoint) {
      dragStartRef.current = getAxisValue(axis, hitPoint);
    }

    (event.target as Element).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!dragPlaneRef.current || !(event.buttons & 1)) {
      return;
    }

    event.stopPropagation();

    const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);

    if (!hitPoint) {
      return;
    }

    updateDimensions(axis, getAxisValue(axis, hitPoint));
  }

  return (
    <group position={handlePosition}>
      <Sphere
        args={[0.08, 16, 16]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <meshStandardMaterial color="#7d95b8" roughness={0.3} />
      </Sphere>
      <Html center>
        <span className="resize-badge">{label}</span>
      </Html>
    </group>
  );
}
