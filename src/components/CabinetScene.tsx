import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Camera, MOUSE } from "three";
import { createCabinetSceneItem, type PanelName } from "../domain/cabinetGeometry";
import { millimetresToMetres } from "../domain/cabinetDimensions";
import { Cabinet } from "./Cabinet";
import { DimensionGuides } from "./DimensionGuides";
import { CameraController } from "./cabinetScene/cameraControls";
import { MoveHandle, ResizeHandle, RotateHandle } from "./cabinetScene/handles";
import {
  CountertopMeshes,
  FillerMeshes,
  GroupOutline,
  RoomShell,
  SnapGuides,
} from "./cabinetScene/meshes";
import {
  createMarqueeHandlers,
  type MarqueeRect,
  type MarqueeStart,
} from "./cabinetScene/selectionHandlers";
import {
  captureCanvasThumbnail,
  SceneCaptureBridge,
  SceneViewportBridge,
} from "./cabinetScene/thumbnailCapture";
import type { CabinetSceneHandle, CabinetSceneProps, ViewPreset } from "./cabinetScene/types";
import { getCabinetWorldCenter } from "./cabinetScene/worldCoords";

export type { CabinetSceneHandle } from "./cabinetScene/types";

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
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const marqueeStartRef = useRef<MarqueeStart | null>(null);
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
        return captureCanvasThumbnail(canvasRef.current);
      },
      setViewPreset(preset: ViewPreset) {
        setViewPreset(preset);
      },
      fitView() {
        setFitVersion((prev) => prev + 1);
      },
    }),
    [],
  );

  useEffect(() => {
    setFitVersion((prev) => prev + 1);
  }, [items.length, activeCabinetId]);

  const {
    handleMarqueePointerDown,
    handleMarqueePointerMove,
    handleMarqueePointerUp,
  } = createMarqueeHandlers({
    sceneFrameRef,
    marqueeStartRef,
    marqueeRect,
    setMarqueeRect,
    items,
    viewportCameraRef,
    viewportSizeRef,
    onMarqueeSelect,
  });

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
