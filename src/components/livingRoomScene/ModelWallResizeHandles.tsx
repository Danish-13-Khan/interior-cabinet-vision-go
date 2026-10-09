import { Html } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Plane, Vector3 } from "three";
import type { WallResizeHandleSpec } from "../../domain/livingRoom/wallResizeHandles";
import { EXCLUDE_FROM_EXPORT } from "../../rendering/sceneExport/sceneExportFilter";

export type WallResizeHandlesProps = {
  walls: WallResizeHandleSpec[];
  selectedWallId: string | null;
  snapSizeMm: number;
  /** Face handle: move the whole wall along its outward normal (one-sided room resize). */
  onTranslateWall: (wallId: string, delta: { x: number; z: number }) => void;
  /** End handle: new length with the other end fixed. */
  onSetWallLength: (wallId: string, lengthMm: number, anchor: "start" | "end") => void;
};

type Handle = { kind: "face"; wall: WallResizeHandleSpec } | { kind: "end"; wall: WallResizeHandleSpec; end: "start" | "end" };
type Drag = { pointerId: number; handle: Handle; axis: Vector3; plane: Plane; startCoordinate: number; captureTarget: Element };

const FACE_COLOR = "#3f6b52";
const END_COLOR = "#2f6690";

function wallDirection(wall: WallResizeHandleSpec) {
  const dx = wall.end.x - wall.start.x; const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length, length };
}

/**
 * 3D resize handles. A plate on each outer wall drags the wall along its
 * outward normal, so the opposite wall stays put; two knobs on the selected
 * wall drag its ends along the wall. Geometry commits on release, with a live
 * readout while dragging. Excluded from export and from picking as scene objects.
 */
export function ModelWallResizeHandles(props: WallResizeHandlesProps & { onDragStateChange: (dragging: boolean) => void }) {
  const { camera } = useThree();
  const dragRef = useRef<Drag | null>(null);
  const [offsetMm, setOffsetMm] = useState<{ handle: Handle; mm: number } | null>(null);
  const step = Math.max(1, props.snapSizeMm);

  function dragPlane(axis: Vector3, origin: Vector3) {
    const cameraDirection = camera.getWorldDirection(new Vector3());
    let normal = axis.clone().cross(cameraDirection).cross(axis);
    if (normal.lengthSq() < 0.0001) normal = new Vector3(0, 1, 0);
    return new Plane().setFromNormalAndCoplanarPoint(normal.normalize(), origin);
  }

  function begin(event: ThreeEvent<PointerEvent>, handle: Handle, axis: Vector3, originMm: { x: number; y: number; z: number }) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const origin = new Vector3(originMm.x / 1000, originMm.y / 1000, originMm.z / 1000);
    const plane = dragPlane(axis, origin);
    const hit = event.ray.intersectPlane(plane, new Vector3());
    if (!hit) return;
    const captureTarget = event.target as Element;
    captureTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, handle, axis, plane, startCoordinate: hit.dot(axis), captureTarget };
    setOffsetMm({ handle, mm: 0 });
    props.onDragStateChange(true);
  }

  function move(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const hit = event.ray.intersectPlane(drag.plane, new Vector3());
    if (!hit) return;
    const mm = Math.round(((hit.dot(drag.axis) - drag.startCoordinate) * 1000) / step) * step;
    setOffsetMm({ handle: drag.handle, mm });
  }

  function finish(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
    try { drag.captureTarget.releasePointerCapture(event.pointerId); } catch { /* released */ }
    props.onDragStateChange(false);
    const mm = offsetMm?.mm ?? 0;
    setOffsetMm(null);
    if (mm === 0) return;
    const { handle } = drag;
    if (handle.kind === "face") {
      props.onTranslateWall(handle.wall.wallId, { x: handle.wall.outward.x * mm, z: handle.wall.outward.z * mm });
      return;
    }
    const { length } = wallDirection(handle.wall);
    // Dragging the end along +direction lengthens; dragging the start along +direction shortens.
    const nextLength = handle.end === "end" ? length + mm : length - mm;
    props.onSetWallLength(handle.wall.wallId, Math.max(100, Math.round(nextLength)), handle.end === "end" ? "start" : "end");
  }

  const readout = offsetMm ? (offsetMm.handle.kind === "face"
    ? `${offsetMm.handle.wall.label} ${offsetMm.mm >= 0 ? "+" : ""}${offsetMm.mm} mm`
    : `Length ${Math.round(wallDirection(offsetMm.handle.wall).length + (offsetMm.handle.end === "end" ? offsetMm.mm : -offsetMm.mm))} mm`) : null;

  return (
    <group userData={{ [EXCLUDE_FROM_EXPORT]: true }} renderOrder={1000}>
      {props.walls.map((wall) => {
        const direction = wallDirection(wall);
        const mid = { x: (wall.start.x + wall.end.x) / 2, z: (wall.start.z + wall.end.z) / 2 };
        const y = wall.heightMm / 2;
        const faceOffset = offsetMm?.handle.kind === "face" && offsetMm.handle.wall.wallId === wall.wallId ? offsetMm.mm : 0;
        const faceAt = { x: mid.x + wall.outward.x * (120 + faceOffset), y, z: mid.z + wall.outward.z * (120 + faceOffset) };
        const faceAxis = new Vector3(wall.outward.x, 0, wall.outward.z);
        const yaw = Math.atan2(-direction.z, direction.x);
        const selected = wall.wallId === props.selectedWallId;
        return (
          <group key={wall.wallId}>
            <group position={[faceAt.x / 1000, faceAt.y / 1000, faceAt.z / 1000]} rotation={[0, yaw, 0]}
              userData={{ modelPickId: `wall-face:${wall.wallId}`, modelPickKind: "handle" }}
              onPointerDown={(event) => begin(event, { kind: "face", wall }, faceAxis, faceAt)}
              onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
              <mesh><boxGeometry args={[0.26, 0.26, 0.05]} /><meshBasicMaterial color={FACE_COLOR} transparent opacity={selected ? 0.95 : 0.75} depthTest={false} depthWrite={false} /></mesh>
            </group>
            {selected ? (["start", "end"] as const).map((end) => {
              const at = end === "start" ? wall.start : wall.end;
              const endOffset = offsetMm?.handle.kind === "end" && offsetMm.handle.wall.wallId === wall.wallId && offsetMm.handle.end === end ? offsetMm.mm : 0;
              const pos = { x: at.x + direction.x * endOffset, y, z: at.z + direction.z * endOffset };
              return (
                <group key={end} position={[pos.x / 1000, pos.y / 1000, pos.z / 1000]}
                  userData={{ modelPickId: `wall-end:${wall.wallId}:${end}`, modelPickKind: "handle" }}
                  onPointerDown={(event) => begin(event, { kind: "end", wall, end }, new Vector3(direction.x, 0, direction.z), pos)}
                  onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
                  <mesh><sphereGeometry args={[0.09, 16, 12]} /><meshBasicMaterial color={END_COLOR} depthTest={false} depthWrite={false} /></mesh>
                </group>
              );
            }) : null}
          </group>
        );
      })}
      {readout && offsetMm ? (
        <Html position={[0, 0, 0]} center={false} style={{ pointerEvents: "none" }}>
          <div className="lr-model-gizmo-readout" data-testid="model-wall-resize-readout">{readout}</div>
        </Html>
      ) : null}
    </group>
  );
}
