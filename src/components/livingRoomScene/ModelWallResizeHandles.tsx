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
  /** Face plate: move the whole wall along its outward normal (one-sided room resize). */
  onTranslateWall: (wallId: string, delta: { x: number; z: number }) => void;
  /** End knob: new length with the other end fixed (partitions and free walls only). */
  onSetWallLength: (wallId: string, lengthMm: number, anchor: "start" | "end") => void;
};

type Handle = { kind: "face"; wall: WallResizeHandleSpec } | { kind: "end"; wall: WallResizeHandleSpec; end: "start" | "end" };
type Drag = { pointerId: number; handle: Handle; axis: Vector3; plane: Plane; startCoordinate: number; captureTarget: Element; mm: number };
type Live = { handle: Handle; mm: number };

const FACE_COLOR = "#3f6b52";
const END_COLOR = "#2f6690";

function wallDirection(wall: WallResizeHandleSpec) {
  const dx = wall.end.x - wall.start.x; const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length, length };
}

function endLength(handle: Extract<Handle, { kind: "end" }>, mm: number) {
  // Dragging the end along +direction lengthens; dragging the start along +direction shortens.
  return wallDirection(handle.wall).length + (handle.end === "end" ? mm : -mm);
}

/**
 * 3D resize handles. A plate on each outer wall drags the wall along its
 * outward normal, so the opposite wall stays put; knobs on a selected partition
 * or free wall drag its ends along the wall. Geometry commits on release, with
 * a live readout beside the handle. Excluded from export.
 */
export function ModelWallResizeHandles(props: WallResizeHandlesProps & { onDragStateChange: (dragging: boolean) => void }) {
  const { camera } = useThree();
  const dragRef = useRef<Drag | null>(null);
  const [live, setLive] = useState<Live | null>(null);
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
    dragRef.current = { pointerId: event.pointerId, handle, axis, plane, startCoordinate: hit.dot(axis), captureTarget, mm: 0 };
    setLive({ handle, mm: 0 });
    props.onDragStateChange(true);
  }

  function move(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const hit = event.ray.intersectPlane(drag.plane, new Vector3());
    if (!hit) return;
    // The ref carries the latest millimetres so a fast release never commits a stale render.
    drag.mm = Math.round(((hit.dot(drag.axis) - drag.startCoordinate) * 1000) / step) * step;
    setLive({ handle: drag.handle, mm: drag.mm });
  }

  function finish(event: ThreeEvent<PointerEvent>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
    try { drag.captureTarget.releasePointerCapture(event.pointerId); } catch { /* released */ }
    props.onDragStateChange(false);
    setLive(null);
    const { handle, mm } = drag;
    if (mm === 0) return;
    if (handle.kind === "face") {
      if (handle.wall.outward) props.onTranslateWall(handle.wall.wallId, { x: handle.wall.outward.x * mm, z: handle.wall.outward.z * mm });
      return;
    }
    props.onSetWallLength(handle.wall.wallId, Math.max(100, Math.round(endLength(handle, mm))), handle.end === "end" ? "start" : "end");
  }

  const liveMm = (predicate: (handle: Handle) => boolean) => (live && predicate(live.handle) ? live.mm : 0);
  const readoutFor = (handle: Handle, mm: number) => (handle.kind === "face"
    ? `${handle.wall.label} ${mm >= 0 ? "+" : ""}${mm} mm`
    : `Length ${Math.round(endLength(handle, mm))} mm · other end stays`);
  const readout = (handle: Handle) => (
    live && live.handle === handle ? (
      <Html position={[0, 0.2, 0]} center style={{ pointerEvents: "none" }}>
        <div className="lr-model-gizmo-readout" data-testid="model-wall-resize-readout">{readoutFor(handle, live.mm)}</div>
      </Html>
    ) : null
  );

  return (
    <group userData={{ [EXCLUDE_FROM_EXPORT]: true }} renderOrder={1000}>
      {props.walls.map((wall) => {
        const direction = wallDirection(wall);
        const mid = { x: (wall.start.x + wall.end.x) / 2, z: (wall.start.z + wall.end.z) / 2 };
        const y = wall.heightMm / 2;
        const selected = wall.wallId === props.selectedWallId;
        if (wall.onLoop && wall.outward) {
          const handle: Handle = live?.handle.kind === "face" && live.handle.wall.wallId === wall.wallId ? live.handle : { kind: "face", wall };
          const offset = liveMm((h) => h.kind === "face" && h.wall.wallId === wall.wallId);
          const at = { x: mid.x + wall.outward.x * (120 + offset), y, z: mid.z + wall.outward.z * (120 + offset) };
          const yaw = Math.atan2(-direction.z, direction.x);
          return (
            <group key={wall.wallId} position={[at.x / 1000, at.y / 1000, at.z / 1000]} rotation={[0, yaw, 0]}
              userData={{ modelPickId: `wall-face:${wall.wallId}`, modelPickKind: "handle" }}
              onPointerDown={(event) => begin(event, handle, new Vector3(wall.outward!.x, 0, wall.outward!.z), at)}
              onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
              <mesh><boxGeometry args={[0.26, 0.26, 0.05]} /><meshBasicMaterial color={FACE_COLOR} transparent opacity={selected ? 0.95 : 0.75} depthTest={false} depthWrite={false} /></mesh>
              {readout(handle)}
            </group>
          );
        }
        if (!selected) return null;
        return (["start", "end"] as const).map((end) => {
          const handle: Handle = live?.handle.kind === "end" && live.handle.wall.wallId === wall.wallId && live.handle.end === end
            ? live.handle : { kind: "end", wall, end };
          const offset = liveMm((h) => h.kind === "end" && h.wall.wallId === wall.wallId && h.end === end);
          const base = end === "start" ? wall.start : wall.end;
          const at = { x: base.x + direction.x * offset, y, z: base.z + direction.z * offset };
          return (
            <group key={`${wall.wallId}:${end}`} position={[at.x / 1000, at.y / 1000, at.z / 1000]}
              userData={{ modelPickId: `wall-end:${wall.wallId}:${end}`, modelPickKind: "handle" }}
              onPointerDown={(event) => begin(event, handle, new Vector3(direction.x, 0, direction.z), at)}
              onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
              <mesh><sphereGeometry args={[0.09, 16, 12]} /><meshBasicMaterial color={END_COLOR} depthTest={false} depthWrite={false} /></mesh>
              {readout(handle)}
            </group>
          );
        });
      })}
    </group>
  );
}
