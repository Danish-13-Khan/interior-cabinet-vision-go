import { useEffect, useRef, useState, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import type { LightEntity } from "../../../domain/interiorProject";
import { roomLightRotation } from "./fixtureMeasures";

const UP = new Vector3(0, 1, 0);

/** tokens.css `--accent`. Fallback is that token's own value when CSS is not applied. */
const ACCENT_FALLBACK = "#3f6b52";

export function selectionAccentColor() {
  if (typeof document === "undefined") return ACCENT_FALLBACK;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return value || ACCENT_FALLBACK;
}

/** Movement under this many metres is a click, not a drag. */
const DRAG_SLOP_M = 0.005;

type DragState = { plane: Plane; offset: Vector3; moved: boolean };

export function FixtureGroup({
  light,
  span,
  spanOffset = [0, 0, 0],
  selected = false,
  onSelect,
  onMove,
  onDragState,
  children,
}: {
  light: LightEntity;
  /** Local axis-aligned body, metres, before the saved rotation. */
  span: [number, number, number];
  /** Where that body is centred, when it is not on the light's origin (recessed cans, surface cylinders). */
  spanOffset?: [number, number, number];
  selected?: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, point: { x: number; y: number; z: number }) => void;
  onDragState?: (dragging: boolean) => void;
  children: ReactNode;
}) {
  useEffect(() => () => {
    if (typeof document !== "undefined" && document.body.style.cursor === "pointer") {
      document.body.style.cursor = "";
    }
  }, []);
  const [preview, setPreview] = useState<[number, number, number] | null>(null);
  const drag = useRef<DragState | null>(null);
  const origin: [number, number, number] = [light.position.x / 1000, light.position.y / 1000, light.position.z / 1000];
  const onWall = typeof light.parameters.hostWallId === "string" && light.parameters.hostWallId !== "";
  const onObject = typeof light.parameters.hostObjectId === "string" && light.parameters.hostObjectId !== "";
  // A light fixed to a cabinet follows the cabinet; a fitted wall strip can only change height.
  const draggable = selected && Boolean(onMove) && !onObject;
  const heightOnly = onWall && light.parameters.fitHostWidth === true;

  function endDrag(event: ThreeEvent<PointerEvent>, commit: boolean) {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
    onDragState?.(false);
    const at = preview;
    setPreview(null);
    if (commit && active.moved && at) {
      onMove?.(light.id, { x: at[0] * 1000, y: at[1] * 1000, z: at[2] * 1000 });
    }
  }

  const selectable = Boolean(onSelect);
  const pick = selectable ? {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelect?.(light.id);
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      document.body.style.cursor = draggable ? "grab" : "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  } : {};
  const move = draggable ? {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const start = new Vector3(...origin);
      // Wall lights slide in the wall's own plane; ceiling and free lights slide level.
      const normal = onWall
        ? new Vector3(0, 0, -1).applyAxisAngle(UP, (light.rotation.y * Math.PI) / 180)
        : UP.clone();
      const plane = new Plane().setFromNormalAndCoplanarPoint(normal, start);
      const hit = event.ray.intersectPlane(plane, new Vector3());
      if (!hit) return;
      drag.current = { plane, offset: start.clone().sub(hit), moved: false };
      (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
      onDragState?.(true);
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      const active = drag.current;
      if (!active) return;
      event.stopPropagation();
      const hit = event.ray.intersectPlane(active.plane, new Vector3());
      if (!hit) return;
      const next = hit.add(active.offset);
      if (heightOnly) next.set(origin[0], next.y, origin[2]);
      if (!active.moved && next.distanceTo(new Vector3(...origin)) < DRAG_SLOP_M) return;
      active.moved = true;
      setPreview([next.x, Math.max(0, next.y), next.z]);
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => endDrag(event, true),
    onPointerCancel: (event: ThreeEvent<PointerEvent>) => endDrag(event, false),
  } : {};
  const shown = preview ?? origin;
  return (
    <>
      <group position={shown} rotation={roomLightRotation(light.rotation)} {...pick} {...move}>
        {children}
        {selectable ? <PickProxy span={span} offset={spanOffset} /> : null}
        {selected ? <SelectionOutline span={span} offset={spanOffset} /> : null}
      </group>
      {selected ? (
        // World-up offset, outside the rotated group, so the tag sits above any mount.
        <Html position={[shown[0], shown[1] + 0.22, shown[2]]} center distanceFactor={7}>
          <span
            className="lr-model-object-label is-pickable is-selected is-light"
            data-model-select="light"
            data-model-id={light.id}
          >
            {light.name}
          </span>
        </Html>
      ) : null}
    </>
  );
}

/** Thinnest side of the invisible grab box, metres. A 12 mm rope is a pixel wide from across a room. */
const PICK_MIN_M = 0.08;

/** Invisible, fatter body so thin strips can be clicked and dragged. Casts and writes nothing. */
function PickProxy({ span, offset }: { span: [number, number, number]; offset: [number, number, number] }) {
  return (
    <mesh position={offset}>
      <boxGeometry args={[Math.max(span[0], PICK_MIN_M), Math.max(span[1], PICK_MIN_M), Math.max(span[2], PICK_MIN_M)]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function SelectionOutline({ span, offset }: { span: [number, number, number]; offset: [number, number, number] }) {
  return (
    <mesh raycast={() => null} position={offset}>
      <boxGeometry args={[span[0] + 0.016, span[1] + 0.016, span[2] + 0.016]} />
      <meshBasicMaterial color={selectionAccentColor()} wireframe depthTest={false} />
    </mesh>
  );
}
