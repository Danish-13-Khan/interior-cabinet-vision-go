import { useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, Line, Sphere } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import { getFootprintDimensions } from "../../domain/cabinetDimensions";
import type { RotateHandleProps } from "./types";
import { getCabinetWorldCenter } from "./worldCoords";

export function RotateHandle({ cabinet, onRotate }: RotateHandleProps) {
  const dragStartRef = useRef<number>(0);
  const startRotationRef = useRef(cabinet.placement.rotation);
  const planeRef = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const pointerRef = useRef(new Vector3());
  const [isDragging, setIsDragging] = useState(false);
  const center = getCabinetWorldCenter(cabinet);
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const radius = Math.max(footprint.width, footprint.depth) / 1000 / 2 + 0.18;

  const arcPoints = useMemo(() => {
    const segments = 64;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([
        center[0] + Math.cos(angle) * radius,
        center[1],
        center[2] + Math.sin(angle) * radius,
      ]);
    }
    return pts;
  }, [center, radius]);

  function getAngleFromPoint(point: Vector3): number {
    const dx = point.x - center[0];
    const dz = point.z - center[2];
    return Math.atan2(dz, dx) * (180 / Math.PI);
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    startRotationRef.current = cabinet.placement.rotation;
    const hitPoint = event.ray.intersectPlane(planeRef.current, pointerRef.current);
    if (hitPoint) {
      dragStartRef.current = getAngleFromPoint(hitPoint);
    }
    setIsDragging(true);
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!isDragging || !(event.buttons & 1)) return;
    const hitPoint = event.ray.intersectPlane(planeRef.current, pointerRef.current);
    if (!hitPoint) return;
    const currentAngle = getAngleFromPoint(hitPoint);
    const delta = currentAngle - dragStartRef.current;
    let newRotation = startRotationRef.current + delta;
    newRotation = Math.round(newRotation / 90) * 90;
    if (newRotation !== cabinet.placement.rotation) {
      onRotate({
        ...cabinet.placement,
        rotation: ((newRotation % 360 + 360) % 360) as 0 | 90 | 180 | 270,
      });
    }
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  return (
    <group>
      <Line
        points={arcPoints}
        color={isDragging ? "#5b8def" : "#8799b0"}
        lineWidth={1.8}
        position={[0, 0, 0]}
      />
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const hx = center[0] + Math.cos(rad) * radius;
        const hz = center[2] + Math.sin(rad) * radius;
        return (
          <Sphere
            key={angle}
            args={[0.065, 16, 16]}
            position={[hx, center[1], hz]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <meshStandardMaterial
              color={isDragging ? "#5b8def" : "#7d95b8"}
              roughness={0.3}
              emissive={isDragging ? "#2b5fc4" : "#000000"}
              emissiveIntensity={isDragging ? 0.4 : 0}
            />
          </Sphere>
        );
      })}
      <Html position={[center[0], center[1] + 0.15, center[2] + radius + 0.06]} center>
        <span className="scene-hint">Rotate</span>
      </Html>
    </group>
  );
}
