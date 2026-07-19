import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sphere } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MOUSE, Plane, Vector3 } from "three";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import {
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  getFootprintDimensions,
  millimetresToMetres,
  ROOM_DEPTH_MM,
  ROOM_HEIGHT_MM,
  ROOM_WIDTH_MM,
  snapMillimetresToGrid,
  usesRotatedFootprint,
} from "../domain/cabinetDimensions";
import {
  createCabinetSceneItem,
  type CabinetSceneItem,
  type PanelName,
} from "../domain/cabinetGeometry";
import { Cabinet } from "./Cabinet";
import { DimensionGuides } from "./DimensionGuides";
import type { RoomConfig } from "../domain/roomModel";

type ViewPreset = "iso" | "front" | "side" | "top";
type ResizeAxis = "width" | "height" | "depth";

export type CabinetSceneHandle = {
  captureThumbnail: () => string | null;
};

type CabinetSceneProps = {
  project: CabinetProject;
  snapSizeMm: number;
  room?: RoomConfig;
  onCabinetMove: (cabinetId: string, placement: CabinetInstance["placement"]) => boolean;
  onCabinetRotate?: (cabinetId: string, rotation: number) => void;
  selectedCabinetId: string | null;
  selectedPanelName: PanelName | null;
  onCabinetResize: (cabinetId: string, dimensions: CabinetInstance["config"]["dimensions"]) => void;
  onSelectedCabinetChange: (cabinetId: string | null) => void;
  onSelectedPanelChange: (cabinetId: string | null, name: PanelName | null) => void;
};

type CameraControllerProps = {
  items: CabinetSceneItem[];
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
  snapSizeMm: number;
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
        width: millimetresToMetres(ROOM_WIDTH_MM) / 2,
        height: millimetresToMetres(ROOM_HEIGHT_MM) * 0.5,
        depth: millimetresToMetres(ROOM_DEPTH_MM) / 2,
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
  }, [camera, controlsRef, fitVersion, items, selectedCabinetId, viewPreset]);

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

function MoveHandle({ cabinet, snapSizeMm, onMove, onDragStateChange }: MoveHandleProps) {
  const dragPlaneRef = useRef<Plane | null>(null);
  const dragOffsetRef = useRef(new Vector3());
  const pointerRef = useRef(new Vector3());
  const [isDragging, setIsDragging] = useState(false);
  const center = getCabinetWorldCenter(cabinet);
  const centerVec = useMemo(() => new Vector3(...center), [center]);

  function getDragPlane(attachment: CabinetInstance["placement"]["attachment"]): Plane {
    const halfDepthM = ROOM_DEPTH_MM / 2000;
    const halfWidthM = ROOM_WIDTH_MM / 2000;
    switch (attachment) {
      case "floor": return new Plane(new Vector3(0, 1, 0), 0);
      case "back-wall": return new Plane(new Vector3(0, 0, 1), halfDepthM);
      case "left-wall": return new Plane(new Vector3(1, 0, 0), halfWidthM);
      case "right-wall": return new Plane(new Vector3(1, 0, 0), -halfWidthM);
    }
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();

    const attachment = cabinet.placement.attachment;
    dragPlaneRef.current = getDragPlane(attachment);
    const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);
    if (hitPoint) {
      dragOffsetRef.current.copy(centerVec).sub(hitPoint);
    }

    setIsDragging(true);
    onDragStateChange?.(true);

    const el = event.nativeEvent?.target as HTMLElement | undefined;
    if (el?.setPointerCapture) {
      el.setPointerCapture((event.nativeEvent as PointerEvent).pointerId);
    }
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!dragPlaneRef.current || !(event.buttons & 1)) return;

    event.stopPropagation();

    const hitPoint = event.ray.intersectPlane(dragPlaneRef.current, pointerRef.current);
    if (!hitPoint) return;

    // Apply stored offset so the object follows the pointer smoothly.
    const wx = hitPoint.x + dragOffsetRef.current.x;
    const wy = hitPoint.y + dragOffsetRef.current.y;
    const wz = hitPoint.z + dragOffsetRef.current.z;

    const attachment = cabinet.placement.attachment;

    if (attachment === "floor") {
      onMove({
        ...cabinet.placement,
        x: snapMillimetresToGrid(wx * 1000, snapSizeMm),
        y: 0,
        z: snapMillimetresToGrid(wz * 1000, snapSizeMm),
      });
    } else if (attachment === "back-wall") {
      onMove({
        ...cabinet.placement,
        x: snapMillimetresToGrid(wx * 1000, snapSizeMm),
        y: snapMillimetresToGrid(Math.max(0, wy * 1000), snapSizeMm),
      });
    } else {
      // left-wall or right-wall
      onMove({
        ...cabinet.placement,
        y: snapMillimetresToGrid(Math.max(0, wy * 1000), snapSizeMm),
        z: snapMillimetresToGrid(wz * 1000, snapSizeMm),
      });
    }
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    dragPlaneRef.current = null;
    setIsDragging(false);
    onDragStateChange?.(false);

    const el = event.nativeEvent?.target as HTMLElement | undefined;
    if (el?.releasePointerCapture) {
      el.releasePointerCapture((event.nativeEvent as PointerEvent).pointerId);
    }
  }

  return (
    <group position={center}>
      <Sphere
        args={[0.1, 16, 16]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <meshStandardMaterial
          color={isDragging ? "#5b8def" : "#92abca"}
          roughness={0.25}
          emissive={isDragging ? "#295fc7" : "#000000"}
          emissiveIntensity={isDragging ? 0.3 : 0}
        />
      </Sphere>
      <Html center>
        <span className="move-badge">Move</span>
      </Html>
    </group>
  );
}

function RoomShell() {
  const halfW = ROOM_WIDTH_MM / 2000;
  const halfD = ROOM_DEPTH_MM / 2000;
  const h = ROOM_HEIGHT_MM / 1000;

  const wallLines: [number, number, number][][] = [
    // back wall bottom
    [[-halfW, 0, -halfD], [halfW, 0, -halfD]],
    // left wall bottom
    [[-halfW, 0, -halfD], [-halfW, 0, halfD]],
    // right wall bottom
    [[halfW, 0, -halfD], [halfW, 0, halfD]],
    // back wall top
    [[-halfW, h, -halfD], [halfW, h, -halfD]],
    // left wall top
    [[-halfW, h, -halfD], [-halfW, h, halfD]],
    // right wall top
    [[halfW, h, -halfD], [halfW, h, halfD]],
    // vertical corners
    [[-halfW, 0, -halfD], [-halfW, h, -halfD]],
    [[halfW, 0, -halfD], [halfW, h, -halfD]],
    [[-halfW, 0, halfD], [-halfW, h, halfD]],
    [[halfW, 0, halfD], [halfW, h, halfD]],
  ];

  return (
    <group>
      {wallLines.map((points, i) => (
        <Line key={i} points={points as [number, number, number][]} color="#b6beca" lineWidth={1} />
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
    </group>
  );
}

function SnapGuides({
  cabinet,
  snapSizeMm,
}: {
  cabinet: CabinetSceneItem;
  snapSizeMm: number;
}) {
  const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
  const halfW = footprint.width / 2000;
  const halfD = footprint.depth / 2000;
  const cx = cabinet.placement.x / 1000;
  const cz = cabinet.placement.z / 1000;
  const roomHalfW = ROOM_WIDTH_MM / 2000;
  const roomHalfD = ROOM_DEPTH_MM / 2000;
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

export const CabinetScene = forwardRef<CabinetSceneHandle, CabinetSceneProps>(function CabinetScene(
  {
    project,
    snapSizeMm,
    onCabinetMove,
    onCabinetRotate,
    selectedCabinetId,
    selectedPanelName,
    onCabinetResize,
    onSelectedCabinetChange,
    onSelectedPanelChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>("iso");
  const [fitVersion, setFitVersion] = useState(0);
  const [hovered, setHovered] = useState<{ cabinetId: string; panelName: PanelName } | null>(null);
  const [isolateSelected, setIsolateSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const items = useMemo(
    () => project.cabinets.map((cabinet) => createCabinetSceneItem(cabinet)),
    [project],
  );

  const selectedCabinet = useMemo(
    () => items.find((item) => item.id === selectedCabinetId) ?? null,
    [items, selectedCabinetId],
  );

  const handleCanvasReady = useCallback((element: HTMLCanvasElement) => {
    canvasRef.current = element;
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
    }),
    [],
  );

  useEffect(() => {
    setFitVersion((prev) => prev + 1);
  }, [items.length, selectedCabinetId]);

  return (
    <div className="scene-frame">
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
            : "Click an item to select it. Use the palette to add items."}
        </span>
      </div>

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
        <CameraController
          items={items}
          selectedCabinetId={selectedCabinetId}
          viewPreset={viewPreset}
          fitVersion={fitVersion}
          controlsRef={controlsRef}
        />
        <color attach="background" args={["#f4f6f8"]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[5.2, 6.5, 4.4]} intensity={1.4} castShadow />
        <gridHelper
          args={[
            millimetresToMetres(Math.max(ROOM_WIDTH_MM, ROOM_DEPTH_MM)),
            Math.max(ROOM_WIDTH_MM, ROOM_DEPTH_MM) / snapSizeMm,
            "#b6c0ca",
            "#d8dde3",
          ]}
        />
        <RoomShell />

        {items.map((cabinet) => {
          const isSelectedCabinet = cabinet.id === selectedCabinetId;
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
                isolatedPanelName={isSelectedCabinet && isolateSelected ? selectedPanelName : null}
                selectedPanelName={isSelectedCabinet ? selectedPanelName : null}
                isCabinetSelected={isSelectedCabinet}
                onHoverPanel={(cabinetId, name) =>
                  setHovered(name ? { cabinetId, panelName: name } : null)
                }
                onSelectPanel={(cabinetId, name) => {
                  onSelectedCabinetChange(cabinetId);
                  onSelectedPanelChange(cabinetId, name);
                }}
              />
              {isSelectedCabinet ? <DimensionGuides config={cabinet.config} /> : null}
              {/* Item label */}
              <Html position={[0, cabinet.config.dimensions.height / 2000 + 0.12, 0]} center>
                <span className={`item-label ${isSelectedCabinet ? "item-label-selected" : ""}`}>
                  {cabinet.name}
                </span>
              </Html>
            </group>
          );
        })}

        {selectedCabinet ? (
          <>
            <MoveHandle
              cabinet={selectedCabinet}
              snapSizeMm={snapSizeMm}
              onMove={(placement) => onCabinetMove(selectedCabinet.id, placement)}
              onDragStateChange={setIsDragging}
            />
            <SnapGuides cabinet={selectedCabinet} snapSizeMm={snapSizeMm} />
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
