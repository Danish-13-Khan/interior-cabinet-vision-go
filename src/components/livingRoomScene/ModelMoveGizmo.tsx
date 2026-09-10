import { type ThreeEvent, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useLayoutEffect, useRef, useState } from "react";
import { Plane, Vector3 } from "three";
import type { Point3Mm } from "../../domain/interiorProject";

export type ModelTransformTarget = {
  kind: "object" | "opening";
  id: string;
  positionMm: Point3Mm;
};

export type ModelTransformPreview = ModelTransformTarget;

type Axis = "x" | "y" | "z";
const AXES: Record<Axis, Vector3> = {
  x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1),
};
const COLORS: Record<Axis, string> = { x: "#e14d4d", y: "#35a866", z: "#3478e5" };

type Drag = {
  pointerId: number;
  axis: Axis;
  plane: Plane;
  startCoordinate: number;
  startPosition: Point3Mm;
  captureTarget: Element;
};

export function ModelMoveGizmo({ target, positionOverride, snapSizeMm, onPreview, onCommit, onDragStateChange }: {
  target: ModelTransformTarget;
  positionOverride?: Point3Mm | null;
  snapSizeMm: number;
  onPreview: (position: Point3Mm) => Point3Mm;
  onCommit: (position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const { camera } = useThree();
  const [position, setPosition] = useState(target.positionMm);
  const positionRef = useRef(position);
  const dragRef = useRef<Drag | null>(null);
  positionRef.current = position;

  useLayoutEffect(() => {
    if (dragRef.current) return;
    const next = positionOverride ?? target.positionMm;
    positionRef.current = next;
    setPosition(next);
  }, [
    positionOverride?.x, positionOverride?.y, positionOverride?.z,
    target.id, target.kind, target.positionMm.x, target.positionMm.y, target.positionMm.z,
  ]);

  function intersect(event: ThreeEvent<PointerEvent>, plane: Plane) {
    return event.ray.intersectPlane(plane, new Vector3());
  }

  function begin(event: ThreeEvent<PointerEvent>, axis: Axis) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const axisVector = AXES[axis];
    const cameraDirection = camera.getWorldDirection(new Vector3());
    let normal = axisVector.clone().cross(cameraDirection).cross(axisVector);
    if (normal.lengthSq() < 0.0001) {
      normal = axis === "y" ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);
    }
    normal.normalize();
    const currentPosition = positionRef.current;
    const origin = new Vector3(currentPosition.x / 1000, currentPosition.y / 1000, currentPosition.z / 1000);
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, origin);
    const hit = intersect(event, plane);
    if (!hit) return;
    // R3F decorates event.target so captured objects keep receiving pointer
    // moves after the cursor leaves the thin arrow. Capturing nativeEvent.target
    // only captures the canvas and drops the axis from subsequent ray hits.
    const captureTarget = event.target as Element;
    captureTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      axis,
      plane,
      startCoordinate: hit.dot(axisVector),
      startPosition: { ...currentPosition },
      captureTarget,
    };
    onDragStateChange(true);
  }

  function move(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const hit = intersect(event, drag.plane);
    if (!hit) return;
    const deltaMm = (hit.dot(AXES[drag.axis]) - drag.startCoordinate) * 1000;
    const step = Math.max(1, snapSizeMm);
    const proposed = {
      ...drag.startPosition,
      [drag.axis]: Math.round((drag.startPosition[drag.axis] + deltaMm) / step) * step,
    };
    const resolved = onPreview(proposed);
    positionRef.current = resolved;
    setPosition(resolved);
  }

  function finish(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
    try { drag.captureTarget.releasePointerCapture(event.pointerId); } catch { /* released */ }
    onDragStateChange(false);
    onCommit(positionRef.current);
  }

  function arrow(axis: Axis, rotation: [number, number, number], offset: [number, number, number]) {
    return (
      <group
        key={axis}
        rotation={rotation}
        onPointerDown={(event) => begin(event, axis)}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.72, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.012, 0.012, 0.52, 12]} /><meshBasicMaterial color={COLORS[axis]} depthTest={false} depthWrite={false} /></mesh>
        <mesh position={offset}><coneGeometry args={[0.045, 0.13, 14]} /><meshBasicMaterial color={COLORS[axis]} depthTest={false} depthWrite={false} /></mesh>
      </group>
    );
  }

  return (
    <group position={[position.x / 1000, position.y / 1000, position.z / 1000]} renderOrder={1000}>
      <mesh><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} /></mesh>
      {arrow("x", [0, 0, -Math.PI / 2], [0, 0.58, 0])}
      {arrow("y", [0, 0, 0], [0, 0.58, 0])}
      {arrow("z", [Math.PI / 2, 0, 0], [0, 0.58, 0])}
      <Html position={[0.68, 0, 0]} center style={{ pointerEvents: "none" }}><span className="lr-model-gizmo-axis is-x">X</span></Html>
      <Html position={[0, 0.68, 0]} center style={{ pointerEvents: "none" }}><span className="lr-model-gizmo-axis is-y">Y</span></Html>
      <Html position={[0, 0, 0.68]} center style={{ pointerEvents: "none" }}><span className="lr-model-gizmo-axis is-z">Z</span></Html>
      <Html position={[0.08, 0.72, 0]} center={false} style={{ pointerEvents: "none" }}>
        <div
          className="lr-model-gizmo-readout"
          data-testid="model-move-gizmo-readout"
          data-target-kind={target.kind}
          data-target-id={target.id}
        >X {Math.round(position.x)} · Y {Math.round(position.y)} · Z {Math.round(position.z)} mm</div>
      </Html>
    </group>
  );
}
