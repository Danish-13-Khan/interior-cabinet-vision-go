import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sphere } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Camera, MOUSE, Plane, Vector2, Vector3 } from "three";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import {
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  getFootprintDimensions,
  millimetresToMetres,
  snapMillimetresToGrid,
  usesRotatedFootprint,
} from "../domain/cabinetDimensions";
import {
  createCabinetSceneItem,
  type CabinetSceneItem,
  type PanelName,
} from "../domain/cabinetGeometry";
import type {
  CountertopSegment,
  RunFiller,
} from "../domain/cabinetLibrary";
import { Cabinet } from "./Cabinet";
import { DimensionGuides } from "./DimensionGuides";
import type { RoomConfig } from "../domain/roomModel";

type ViewPreset = "iso" | "front" | "side" | "top";
type ResizeAxis = "width" | "height" | "depth";

export type CabinetSceneHandle = {
  captureThumbnail: () => string | null;
  setViewPreset: (preset: ViewPreset) => void;
};

type CabinetSceneProps = {
  project: CabinetProject;
  snapSizeMm: number;
  showGrid?: boolean;
  room?: RoomConfig;
  countertops?: CountertopSegment[];
  fillers?: RunFiller[];
  onCabinetMove: (cabinetId: string, placement: CabinetInstance["placement"]) => boolean;
  onCabinetRotate?: (cabinetId: string, rotation: number) => void;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  onCabinetResize: (cabinetId: string, dimensions: CabinetInstance["config"]["dimensions"]) => void;
  onSelectedCabinetChange: (cabinetId: string | null, additive?: boolean) => void;
  onSelectedPanelChange: (cabinetId: string | null, name: PanelName | null, additive?: boolean) => void;
  onMarqueeSelect?: (cabinetIds: string[], additive?: boolean) => void;
};

type CameraControllerProps = {
  items: CabinetSceneItem[];
  roomDimensions: RoomShellDims;
  selectedCabinetId: string | null;
  viewPreset: ViewPreset;
  fitVersion: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

type ResizeHandleProps = {
  axis: ResizeAxis;
  cabinet: CabinetSceneItem;
  onResize: (dimensions: CabinetInstance["config"]["dimensions"]) => void;
};

type MoveHandleProps = {
  cabinet: CabinetSceneItem;
  roomDimensions: RoomShellDims;
  snapSizeMm: number;
  allCabinets?: CabinetSceneItem[];
  onMove: (placement: CabinetInstance["placement"]) => boolean;
  onDragStateChange?: (dragging: boolean) => void;
};

type RotateHandleProps = {
  cabinet: CabinetSceneItem;
  onRotate: (placement: CabinetInstance["placement"]) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

function getCabinetWorldCenter(cabinet: CabinetSceneItem): [number, number, number] {
  return [
    cabinet.placement.x / 1000,
    cabinet.placement.y / 1000 + cabinet.config.dimensions.height / 2000,
    cabinet.placement.z / 1000,
  ];
}

function getSceneTarget(items: CabinetSceneItem[], selectedCabinetId: string | null) {
  const selectedCabinet = items.find((item) => item.id === selectedCabinetId);

  if (selectedCabinet) {
    const [x, y, z] = getCabinetWorldCenter(selectedCabinet);
    return new Vector3(x, y, z);
  }

  if (items.length === 0) {
    return new Vector3(0, 0.7, 0);
  }

  const sum = items.reduce(
    (accumulator, item) => {
      const [x, y, z] = getCabinetWorldCenter(item);
      accumulator.x += x;
      accumulator.z += z;
      accumulator.y = Math.max(accumulator.y, y);
      return accumulator;
    },
    { x: 0, y: 0.8, z: 0 },
  );

  return new Vector3(sum.x / items.length, sum.y, sum.z / items.length);
}

function CameraController({
  items,
  roomDimensions,
  selectedCabinetId,
  viewPreset,
  fitVersion,
  controlsRef,
}: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    const target = getSceneTarget(items, selectedCabinetId);
    const extents = items.reduce(
      (accumulator, item) => {
        const center = getCabinetWorldCenter(item);
        const footprint = getFootprintDimensions(item.config.dimensions, item.placement.rotation);
        accumulator.width = Math.max(
          accumulator.width,
          Math.abs(center[0] - target.x) + footprint.width / 2000,
        );
        accumulator.depth = Math.max(
          accumulator.depth,
          Math.abs(center[2] - target.z) + footprint.depth / 2000,
        );
        accumulator.height = Math.max(accumulator.height, center[1] + item.config.dimensions.height / 2000);
        return accumulator;
      },
      {
        width: millimetresToMetres(roomDimensions.widthMm) / 2,
        height: millimetresToMetres(roomDimensions.heightMm) * 0.5,
        depth: millimetresToMetres(roomDimensions.depthMm) / 2,
      },
    );
    const span = Math.max(extents.width * 2, extents.height, extents.depth * 2);
    const distance = span * 1.1 + 1.6;

    switch (viewPreset) {
      case "front":
        camera.position.set(target.x, target.y + extents.height * 0.08, target.z + distance);
        break;
      case "side":
        camera.position.set(target.x + distance, target.y + extents.height * 0.08, target.z);
        break;
      case "top":
        camera.position.set(target.x + 0.001, target.y + distance, target.z + 0.001);
        break;
      default:
        camera.position.set(
          target.x + distance * 0.82,
          target.y + distance * 0.52,
          target.z + distance * 0.7,
        );
        break;
    }

    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
  }, [camera, controlsRef, fitVersion, items, roomDimensions.depthMm, roomDimensions.heightMm, roomDimensions.widthMm, selectedCabinetId, viewPreset]);

  return null;
}

function SceneCaptureBridge({
  onCanvasReady,
}: {
  onCanvasReady: (element: HTMLCanvasElement) => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    onCanvasReady(gl.domElement);
  }, [gl, onCanvasReady]);

  return null;
}

function SceneViewportBridge({
  onViewportChange,
}: {
  onViewportChange: (camera: Camera, size: { width: number; height: number }) => void;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    onViewportChange(camera, size);
  }, [camera, onViewportChange, size]);

  return null;
}

function getGroupColor(groupId: string | null | undefined) {
  if (!groupId) {
    return "#8aa0b6";
  }

  const palette = ["#4f86c6", "#4ca87d", "#c17b41", "#9b6bd3", "#c0577a", "#5385a1"];
  let hash = 0;
  for (let index = 0; index < groupId.length; index += 1) {
    hash = (hash * 31 + groupId.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

function GroupOutline({ cabinet }: { cabinet: CabinetSceneItem }) {
  if (!cabinet.groupId) {
    return null;
  }

  const width = cabinet.config.dimensions.width / 1000 + 0.03;
  const depth = cabinet.config.dimensions.depth / 1000 + 0.03;
  const height = cabinet.config.dimensions.height / 1000 + 0.03;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const halfHeight = height / 2;
  const color = getGroupColor(cabinet.groupId);

  const basePoints: [number, number, number][] = [
    [-halfWidth, -halfHeight, -halfDepth],
    [halfWidth, -halfHeight, -halfDepth],
    [halfWidth, -halfHeight, halfDepth],
    [-halfWidth, -halfHeight, halfDepth],
    [-halfWidth, -halfHeight, -halfDepth],
  ];
  const topPoints: [number, number, number][] = basePoints.map(([x, , z]) => [x, halfHeight, z]);

  return (
    <group>
      <Line points={basePoints} color={color} lineWidth={1.2} />
      <Line points={topPoints} color={color} lineWidth={1.2} />
      {[
        [[-halfWidth, -halfHeight, -halfDepth], [-halfWidth, halfHeight, -halfDepth]],
        [[halfWidth, -halfHeight, -halfDepth], [halfWidth, halfHeight, -halfDepth]],
        [[halfWidth, -halfHeight, halfDepth], [halfWidth, halfHeight, halfDepth]],
        [[-halfWidth, -halfHeight, halfDepth], [-halfWidth, halfHeight, halfDepth]],
      ].map((points, index) => (
        <Line key={index} points={points as [number, number, number][]} color={color} lineWidth={1.2} />
      ))}
      <Html position={[0, halfHeight + 0.08, 0]} center>
        <span className="group-badge">Group</span>
      </Html>
    </group>
  );
}

function RotateHandle({ cabinet, onRotate }: RotateHandleProps) {
  const dragStartRef = useRef<number>(0);
  const startRotationRef = useRef(cabinet.placement.rotation);
  const planeRef = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const pointerRef = useRef(new Vector3());
  const [isDragging, setIsDragging] = useState(false);
  const center = getCabinetWorldCenter(cabinet);
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const radius = Math.max(footprint.width, footprint.depth) / 1000 / 2 + 0.18;

  // Build arc points for the rotation ring
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
      {/* Rotation ring */}
      <Line
        points={arcPoints}
        color={isDragging ? "#5b8def" : "#8799b0"}
        lineWidth={1.8}
        position={[0, 0, 0]}
      />
      {/* Rotation ring on plane that passes through cabinet center */}
      {/* We'll place small drag handles around the ring */}
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
      {/* Ring label */}
      <Html position={[center[0], center[1] + 0.15, center[2] + radius + 0.06]} center>
        <span className="scene-hint">Rotate</span>
      </Html>
    </group>
  );
}

function ResizeHandle({ axis, cabinet, onResize }: ResizeHandleProps) {
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


function smartSnap(value: number, myWidth: number, targets: { x: number; w: number }[], grid: number): number {
  let best = value;

  // Grid snap
  best = snapMillimetresToGrid(best, grid);

  // Alignment snap: align left/right/center edges with other cabinets
  const ALIGN_THRESHOLD = 25;
  for (const t of targets) {
    // My left edge → their left edge
    if (Math.abs(best - myWidth / 2 - (t.x - t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x - t.w / 2 + myWidth / 2;
    // My right edge → their right edge
    if (Math.abs(best + myWidth / 2 - (t.x + t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x + t.w / 2 - myWidth / 2;
    // My left edge → their right edge (flush adjacency)
    if (Math.abs(best - myWidth / 2 - (t.x + t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x + t.w / 2 + myWidth / 2;
    // My right edge → their left edge (flush adjacency)
    if (Math.abs(best + myWidth / 2 - (t.x - t.w / 2)) < ALIGN_THRESHOLD)
      best = t.x - t.w / 2 - myWidth / 2;
  }

  return best;
}

function MoveHandle({
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

    // Smart snap: wall, alignment, adjacency
    const others = allCabinets ? allCabinets.filter(c => c.id !== cabinet.id) : [];
    cx = smartSnap(cx, fp.width, others.map(o => ({ x: o.placement.x, w: getFootprintDimensions(o.config.dimensions, o.placement.rotation).width })), snapSizeMm);
    cz = smartSnap(cz, fp.depth, others.map(o => ({ x: o.placement.z, w: getFootprintDimensions(o.config.dimensions, o.placement.rotation).depth })), snapSizeMm);

    // Wall attraction: snap to wall planes when close
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

type RoomShellDims = {
  widthMm: number; depthMm: number; heightMm: number;
  showBackWall: boolean; showLeftWall: boolean; showRightWall: boolean;
};

function WallOpening({ side, posMm, widthMm, heightMm, sillMm, color, halfW, halfD }: {
  side: string; posMm: number; widthMm: number; heightMm: number;
  sillMm: number; color: string; halfW: number; halfD: number;
}) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const sy = sillMm / 1000;
  let cx: number, cz: number;

  if (side === "back-wall") { cx = posMm / 1000; cz = -halfD; }
  else if (side === "left-wall") { cx = -halfW; cz = posMm / 1000; }
  else { cx = halfW; cz = posMm / 1000; }

  return (
    <mesh position={[cx, sy + h / 2, cz]}
      rotation-y={side === "back-wall" ? 0 : side === "left-wall" ? Math.PI / 2 : -Math.PI / 2}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} side={2} transparent opacity={0.4} />
    </mesh>
  );
}

function RoomShell({ dims, doors, windows }: {
  dims: RoomShellDims;
  doors: { id: string; side: string; positionMm: number; widthMm: number; heightMm: number }[];
  windows: { id: string; side: string; positionMm: number; widthMm: number; heightMm: number; sillHeightMm: number }[];
}) {
  const halfW = dims.widthMm / 2000;
  const halfD = dims.depthMm / 2000;
  const h = dims.heightMm / 1000;

  const wallLines: [number, number, number][][] = [];
  if (dims.showBackWall) {
    wallLines.push([[-halfW, 0, -halfD], [halfW, 0, -halfD]]);
    wallLines.push([[-halfW, h, -halfD], [halfW, h, -halfD]]);
    wallLines.push([[-halfW, 0, -halfD], [-halfW, h, -halfD]]);
    wallLines.push([[halfW, 0, -halfD], [halfW, h, -halfD]]);
  }
  if (dims.showLeftWall) {
    wallLines.push([[-halfW, 0, -halfD], [-halfW, 0, halfD]]);
    wallLines.push([[-halfW, h, -halfD], [-halfW, h, halfD]]);
    wallLines.push([[-halfW, 0, halfD], [-halfW, h, halfD]]);
  }
  if (dims.showRightWall) {
    wallLines.push([[halfW, 0, -halfD], [halfW, 0, halfD]]);
    wallLines.push([[halfW, h, -halfD], [halfW, h, halfD]]);
    wallLines.push([[halfW, 0, halfD], [halfW, h, halfD]]);
  }

  return (
    <group>
      {wallLines.map((points, i) => (
        <Line key={i} points={points} color="#b6beca" lineWidth={1} />
      ))}
      {/* Floor rectangle */}
      <Line
        points={[
          [-halfW, 0.001, -halfD],
          [halfW, 0.001, -halfD],
          [halfW, 0.001, halfD],
          [-halfW, 0.001, halfD],
          [-halfW, 0.001, -halfD],
        ]}
        color="#c8ced6"
        lineWidth={1.2}
      />
      {/* Doors */}
      {doors.map((door) => (
        <WallOpening key={door.id} side={door.side} posMm={door.positionMm}
          widthMm={door.widthMm} heightMm={door.heightMm} sillMm={0}
          color="#93c5fd" halfW={halfW} halfD={halfD} />
      ))}
      {/* Windows */}
      {windows.map((win) => (
        <WallOpening key={win.id} side={win.side} posMm={win.positionMm}
          widthMm={win.widthMm} heightMm={win.heightMm} sillMm={win.sillHeightMm}
          color="#a5d6a7" halfW={halfW} halfD={halfD} />
      ))}
    </group>
  );
}

function SnapGuides({
  cabinet,
  roomDimensions,
  snapSizeMm,
}: {
  cabinet: CabinetSceneItem;
  roomDimensions: RoomShellDims;
  snapSizeMm: number;
}) {
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const halfW = footprint.width / 2000;
  const halfD = footprint.depth / 2000;
  const cx = cabinet.placement.x / 1000;
  const cz = cabinet.placement.z / 1000;
  const roomHalfW = roomDimensions.widthMm / 2000;
  const roomHalfD = roomDimensions.depthMm / 2000;
  const snapMm = snapSizeMm / 1000;

  const guides: [number, number, number][][] = [];

  // Grid snap lines going through the cabinet center
  for (let x = -roomHalfW; x <= roomHalfW; x += snapMm) {
    if (Math.abs(x - cx) < 0.001) {
      guides.push([
        [x, 0.002, -roomHalfD],
        [x, 0.002, roomHalfD],
      ]);
    }
  }
  for (let z = -roomHalfD; z <= roomHalfD; z += snapMm) {
    if (Math.abs(z - cz) < 0.001) {
      guides.push([
        [-roomHalfW, 0.002, z],
        [roomHalfW, 0.002, z],
      ]);
    }
  }

  // Wall proximity guides
  const wallThreshold = 0.2;
  if (Math.abs(cx - halfW - (-roomHalfW)) < wallThreshold) {
    guides.push([
      [-roomHalfW, 0.001, cz - halfD],
      [-roomHalfW, 0.001, cz + halfD],
    ]);
  }
  if (Math.abs(cx + halfW - roomHalfW) < wallThreshold) {
    guides.push([
      [roomHalfW, 0.001, cz - halfD],
      [roomHalfW, 0.001, cz + halfD],
    ]);
  }
  if (Math.abs(cz - halfD - (-roomHalfD)) < wallThreshold) {
    guides.push([
      [cx - halfW, 0.001, -roomHalfD],
      [cx + halfW, 0.001, -roomHalfD],
    ]);
  }
  if (Math.abs(cz + halfD - roomHalfD) < wallThreshold) {
    guides.push([
      [cx - halfW, 0.001, roomHalfD],
      [cx + halfW, 0.001, roomHalfD],
    ]);
  }

  return (
    <group>
      {guides.map((points, i) => (
        <Line key={i} points={points} color="#5b8def" lineWidth={1} dashed={true} />
      ))}
    </group>
  );
}

function CountertopMeshes({ countertops = [] }: { countertops?: CountertopSegment[] }) {
  return (
    <group>
      {countertops.map((countertop) => (
        <mesh
          key={countertop.id}
          position={[
            countertop.positionX / 1000,
            countertop.positionY / 1000 + countertop.thicknessMm / 2000,
            countertop.positionZ / 1000,
          ]}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={[
              countertop.widthMm / 1000,
              countertop.thicknessMm / 1000,
              countertop.depthMm / 1000,
            ]}
          />
          <meshStandardMaterial color="#85715d" roughness={0.58} metalness={0.06} />
        </mesh>
      ))}
    </group>
  );
}

function FillerMeshes({ fillers = [] }: { fillers?: RunFiller[] }) {
  return (
    <group>
      {fillers.map((filler) => (
        <mesh
          key={filler.id}
          position={[
            filler.position.x / 1000,
            filler.size.height / 2000,
            filler.position.z / 1000,
          ]}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={[
              filler.size.width / 1000,
              filler.size.height / 1000,
              filler.size.depth / 1000,
            ]}
          />
          <meshStandardMaterial color="#c7b090" roughness={0.7} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

export const CabinetScene = forwardRef<CabinetSceneHandle, CabinetSceneProps>(function CabinetScene(
  {
    project,
    snapSizeMm,
    showGrid = true,
    room,
    countertops,
    fillers,
    onCabinetMove,
    onCabinetRotate,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
    onCabinetResize,
    onSelectedCabinetChange,
    onSelectedPanelChange,
    onMarqueeSelect,
  },
  ref,
) {
  const sceneFrameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportCameraRef = useRef<Camera | null>(null);
  const viewportSizeRef = useRef({ width: 1, height: 1 });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>("iso");
  const [fitVersion, setFitVersion] = useState(0);
  const [hovered, setHovered] = useState<{ cabinetId: string; panelName: PanelName } | null>(null);
  const [isolateSelected, setIsolateSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number; additive: boolean } | null>(null);
  const roomDimensions = room?.dimensions ?? {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  };

  const items = useMemo(
    () => project.cabinets.map((cabinet) => createCabinetSceneItem(cabinet)),
    [project],
  );

  const selectedCabinet = useMemo(
    () => items.find((item) => item.id === activeCabinetId) ?? null,
    [items, activeCabinetId],
  );

  const handleCanvasReady = useCallback((element: HTMLCanvasElement) => {
    canvasRef.current = element;
  }, []);

  const handleViewportChange = useCallback((camera: Camera, size: { width: number; height: number }) => {
    viewportCameraRef.current = camera;
    viewportSizeRef.current = size;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      captureThumbnail() {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL("image/png", 1);
        } catch {
          return null;
        }
      },
      setViewPreset(preset: ViewPreset) {
        setViewPreset(preset);
      },
    }),
    [],
  );

  useEffect(() => {
    setFitVersion((prev) => prev + 1);
  }, [items.length, activeCabinetId]);

  function toLocalPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = sceneFrameRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function projectCabinetToViewport(cabinet: CabinetSceneItem) {
    if (!viewportCameraRef.current) {
      return null;
    }

    const position = new Vector3(...getCabinetWorldCenter(cabinet));
    position.project(viewportCameraRef.current);

    return new Vector2(
      (position.x * 0.5 + 0.5) * viewportSizeRef.current.width,
      (-position.y * 0.5 + 0.5) * viewportSizeRef.current.height,
    );
  }

  function handleMarqueePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.shiftKey) {
      return;
    }

    const point = toLocalPoint(event);
    if (!point) {
      return;
    }

    marqueeStartRef.current = {
      ...point,
      additive: event.metaKey || event.ctrlKey,
    };
    setMarqueeRect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMarqueePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = marqueeStartRef.current;
    if (!start) {
      return;
    }

    const point = toLocalPoint(event);
    if (!point) {
      return;
    }

    setMarqueeRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMarqueePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = marqueeStartRef.current;
    const rect = marqueeRect;
    marqueeStartRef.current = null;

    if (!start || !rect) {
      return;
    }

    const selectedIds = items
      .filter((cabinet) => {
        const point = projectCabinetToViewport(cabinet);
        if (!point) {
          return false;
        }

        return (
          point.x >= rect.x &&
          point.x <= rect.x + rect.width &&
          point.y >= rect.y &&
          point.y <= rect.y + rect.height
        );
      })
      .map((cabinet) => cabinet.id);

    if (selectedIds.length > 0) {
      onMarqueeSelect?.(selectedIds, start.additive);
    }

    setMarqueeRect(null);
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      ref={sceneFrameRef}
      className={`scene-frame ${marqueeRect ? "scene-frame-marquee" : ""}`}
      onPointerDownCapture={handleMarqueePointerDown}
      onPointerMoveCapture={handleMarqueePointerMove}
      onPointerUpCapture={handleMarqueePointerUp}
    >
      <div className="scene-toolbar">
        <button
          type="button"
          className={`toolbar-btn ${viewPreset === "iso" ? "active" : ""}`}
          onClick={() => setViewPreset("iso")}
        >
          ISO
        </button>
        <button
          type="button"
          className={`toolbar-btn ${viewPreset === "front" ? "active" : ""}`}
          onClick={() => setViewPreset("front")}
        >
          Front
        </button>
        <button
          type="button"
          className={`toolbar-btn ${viewPreset === "side" ? "active" : ""}`}
          onClick={() => setViewPreset("side")}
        >
          Side
        </button>
        <button
          type="button"
          className={`toolbar-btn ${viewPreset === "top" ? "active" : ""}`}
          onClick={() => setViewPreset("top")}
        >
          Top
        </button>
        <button
          type="button"
          className={`toolbar-btn ${isolateSelected ? "active" : ""}`}
          onClick={() => setIsolateSelected((prev) => !prev)}
        >
          {isolateSelected ? "All Panels" : "Isolate"}
        </button>
      </div>

      <div className="scene-overlay">
        <span className="scene-hint">
          {selectedCabinet
            ? `Selected: ${selectedCabinet.name} (${selectedCabinet.config.dimensions.width} × ${selectedCabinet.config.dimensions.height} × ${selectedCabinet.config.dimensions.depth} mm)`
            : "Click an item to select it. Shift-drag for marquee selection."}
        </span>
      </div>
      {marqueeRect ? (
        <div
          className="scene-marquee"
          style={{
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.width,
            height: marqueeRect.height,
          }}
        />
      ) : null}

      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [3.6, 2.4, 2.9], fov: 42 }}
        onPointerMissed={() => {
          onSelectedCabinetChange(null);
          onSelectedPanelChange(null, null);
          setHovered(null);
        }}
      >
        <SceneCaptureBridge onCanvasReady={handleCanvasReady} />
        <SceneViewportBridge onViewportChange={handleViewportChange} />
        <CameraController
          items={items}
          roomDimensions={roomDimensions}
          selectedCabinetId={activeCabinetId}
          viewPreset={viewPreset}
          fitVersion={fitVersion}
          controlsRef={controlsRef}
        />
        <color attach="background" args={["#f4f6f8"]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[5.2, 6.5, 4.4]} intensity={1.4} castShadow />
        {showGrid ? (
          <gridHelper
            args={[
              millimetresToMetres(Math.max(roomDimensions.widthMm, roomDimensions.depthMm)),
              Math.max(roomDimensions.widthMm, roomDimensions.depthMm) / snapSizeMm,
              "#b6c0ca",
              "#d8dde3",
            ]}
          />
        ) : null}
        <RoomShell
          dims={roomDimensions}
          doors={room ? room.doors : []}
          windows={room ? room.windows : []}
        />
        <CountertopMeshes countertops={countertops} />
        <FillerMeshes fillers={fillers} />

        {items.map((cabinet) => {
          const isSelectedCabinet = selectedCabinetIds.includes(cabinet.id);
          const isActiveCabinet = cabinet.id === activeCabinetId;
          const groupPosition = getCabinetWorldCenter(cabinet);

          return (
            <group
              key={cabinet.id}
              position={groupPosition}
              rotation-y={(cabinet.placement.rotation * Math.PI) / 180}
            >
              <Cabinet
                cabinetId={cabinet.id}
                panels={cabinet.panels}
                hoveredPanelName={
                  hovered?.cabinetId === cabinet.id ? hovered.panelName : null
                }
                isolatedPanelName={isActiveCabinet && isolateSelected ? selectedPanelName : null}
                selectedPanelName={isActiveCabinet ? selectedPanelName : null}
                isCabinetSelected={isSelectedCabinet}
                onHoverPanel={(cabinetId, name) =>
                  setHovered(name ? { cabinetId, panelName: name } : null)
                }
                onSelectPanel={(cabinetId, name) => {
                  const additive = false;
                  onSelectedCabinetChange(cabinetId, additive);
                  onSelectedPanelChange(cabinetId, name, additive);
                }}
              />
              <GroupOutline cabinet={cabinet} />
              {isActiveCabinet ? <DimensionGuides config={cabinet.config} /> : null}
              {/* Item label */}
              <Html position={[0, cabinet.config.dimensions.height / 2000 + 0.12, 0]} center>
                <span className={`item-label ${isActiveCabinet ? "item-label-selected" : ""}`}>
                  {cabinet.name}
                </span>
              </Html>
              <mesh
                onClick={(event) => {
                  event.stopPropagation();
                  const additive = event.nativeEvent.metaKey || event.nativeEvent.ctrlKey || event.nativeEvent.shiftKey;
                  onSelectedCabinetChange(cabinet.id, additive);
                  if (!additive) {
                    onSelectedPanelChange(cabinet.id, null, false);
                  }
                }}
                visible={false}
              >
                <boxGeometry
                  args={[
                    cabinet.config.dimensions.width / 1000 + 0.05,
                    cabinet.config.dimensions.height / 1000 + 0.05,
                    cabinet.config.dimensions.depth / 1000 + 0.05,
                  ]}
                />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>
          );
        })}

        {selectedCabinet ? (
          <>
            <MoveHandle
              cabinet={selectedCabinet}
              roomDimensions={roomDimensions}
              snapSizeMm={snapSizeMm}
              allCabinets={items}
              onMove={(placement) => onCabinetMove(selectedCabinet.id, placement)}
              onDragStateChange={setIsDragging}
            />
            <SnapGuides
              cabinet={selectedCabinet}
              roomDimensions={roomDimensions}
              snapSizeMm={snapSizeMm}
            />
            <RotateHandle
              cabinet={selectedCabinet}
              onRotate={(placement) => {
                if (onCabinetRotate) {
                  onCabinetRotate(selectedCabinet.id, placement.rotation);
                } else {
                  const nextPlacement = {
                    ...selectedCabinet.placement,
                    rotation: placement.rotation,
                  };
                  onCabinetMove(selectedCabinet.id, nextPlacement);
                }
              }}
            />
            {selectedCabinet.placement.attachment === "floor" ? (
              <>
                <ResizeHandle
                  axis="width"
                  cabinet={selectedCabinet}
                  onResize={(dimensions) => onCabinetResize(selectedCabinet.id, dimensions)}
                />
                <ResizeHandle
                  axis="height"
                  cabinet={selectedCabinet}
                  onResize={(dimensions) => onCabinetResize(selectedCabinet.id, dimensions)}
                />
                <ResizeHandle
                  axis="depth"
                  cabinet={selectedCabinet}
                  onResize={(dimensions) => onCabinetResize(selectedCabinet.id, dimensions)}
                />
              </>
            ) : null}
          </>
        ) : null}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.15}
          rotateSpeed={0.8}
          enabled={!isDragging}
          minDistance={1.1}
          maxDistance={14}
          target={[0, 0.7, 0]}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.ROTATE,
          }}
        />
      </Canvas>
    </div>
  );
});
