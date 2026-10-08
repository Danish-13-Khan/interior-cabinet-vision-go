import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type {
  CompiledLivingRoomScene,
  ModelViewPresetId,
} from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import {
  MODEL_VIEW_MSAA,
  resolveModelViewDprRange,
} from "../../domain/livingRoom/modelViewSharpness";
import { resolveModelViewCameraFarMeters } from "../../domain/livingRoom/modelViewCameraEase";
import { MODEL_VIEW_FRAMELOOP } from "../../domain/livingRoom/modelViewPerf";
import { useViewportCovered } from "../../hooks/useViewportCovered";
import { ModelViewPreviewProfileProvider } from "../../rendering/ModelViewPreviewProfile";
import { CompiledSceneRenderer } from "./CompiledSceneRenderer";
import { GlbInstancingProvider } from "./GlbInstanceBatch";
import { ModelViewCanvasInvalidator } from "./ModelViewCanvasInvalidator";
import { ModelViewSceneExportBridge } from "./ModelViewSceneExportBridge";
import { StillSurfaceProbe } from "./StillSurfaceProbe";
import type { ModelTransformTarget } from "./ModelMoveGizmo";

type ModelViewSceneProps = {
  scene: CompiledLivingRoomScene;
  viewportQuality: RenderQuality;
  renderMode: RenderMode;
  lightingQuality: EnvironmentLightingQuality;
  projectLightScale: number;
  windowKeyScale: number;
  selectedIds: string[];
  activeOpeningId: string | null;
  activeWallId: string | null;
  activeCameraId: string | null;
  viewPreset: ModelViewPresetId;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  snapSizeMm: number;
  showGrid: boolean;
  cutawayWalls: boolean;
  interactive?: boolean;
  fitVersion?: number;
  fitMode?: ModelViewFitMode;
  fitSelection?: ModelViewFitSelection;
  onClearSelection: () => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
  selectedLightId?: string | null;
  onSelectLight?: (id: string) => void;
  roomLightScale?: number;
  onMoveLight?: (id: string, point: { x: number; y: number; z: number }) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onExitWalkthrough: () => void;
  onMechanismClick: (objectId: string, primitiveId: string) => void;
  onWallContextMenu?: (wallId: string, point: { x: number; y: number }) => void;
  transformTarget?: ModelTransformTarget | null;
  onTransformPreview?: (target: ModelTransformTarget, position: Point3Mm) => Point3Mm;
  onTransformCommit?: (target: ModelTransformTarget, position: Point3Mm) => void;
  frameRun?: CabinetRunAudience;
  /** "project-camera" shows saved cameras exactly as authored (Showcase tour); default re-frames them. */
  renderComposition?: RenderComposition;
  /** Extra scene content, drawn with the compiled room (apartment room pick). */
  overlay?: ReactNode;
  /** Share one draw per repeated model. The room view leaves this off. */
  instanceRepeatedModels?: boolean;
  /** Still capture (`?capture=1`): lock Canvas DPR. Apartment and card scripts use 2. */
  captureFixedDpr?: number;
};

export function ModelViewScene(props: ModelViewSceneProps) {
  const {
    scene, viewportQuality, renderMode, lightingQuality, projectLightScale,
    windowKeyScale, selectedIds, activeOpeningId, activeWallId, activeCameraId, viewPreset,
    cameraHeightMm, fieldOfViewDegrees, snapSizeMm, showGrid, cutawayWalls,
    interactive = true,
    fitVersion = 0, fitMode = "room", fitSelection, onClearSelection, onSelect,
    onSelectOpening, onSelectWall, selectedLightId = null, onSelectLight, onMove, onExitWalkthrough, onMechanismClick,
    onWallContextMenu, transformTarget, onTransformPreview, onTransformCommit,
  } = props;
  const roomSpanMeters = Math.max(
    scene.bounds.size.widthMm,
    scene.bounds.size.depthMm,
  ) / 1000;
  const cameraFar = resolveModelViewCameraFarMeters(roomSpanMeters);
  // A modal dialog hides the canvas: stop drawing until it closes, then redraw once.
  const covered = useViewportCovered();
  const invalidateRevision = [
    covered,
    scene.fingerprint,
    viewportQuality,
    viewPreset,
    activeCameraId,
    fitVersion,
    selectedIds.join(","),
    activeOpeningId,
    activeWallId,
    selectedLightId,
    cutawayWalls,
    showGrid,
    cameraHeightMm,
    fieldOfViewDegrees,
  ].join("|");

  return (
    <Canvas
      frameloop={covered ? "never" : MODEL_VIEW_FRAMELOOP}
      shadows="percentage"
      dpr={props.captureFixedDpr ?? resolveModelViewDprRange(viewportQuality)}
      gl={{ antialias: MODEL_VIEW_MSAA, preserveDrawingBuffer: true }}
      camera={{ position: [0, 1.5, 2], fov: 42, near: 0.05, far: cameraFar }}
      onPointerMissed={interactive ? onClearSelection : undefined}
    >
      <ModelViewPreviewProfileProvider quality={viewportQuality}>
        <ModelViewCanvasInvalidator revision={invalidateRevision} />
        <ModelViewSceneExportBridge />
        {props.captureFixedDpr != null ? <StillSurfaceProbe /> : null}
        <GlbInstancingProvider enabled={props.instanceRepeatedModels === true}>
        <CompiledSceneRenderer
          scene={scene}
          selectedIds={selectedIds}
          selectedOpeningId={activeOpeningId}
          selectedWallId={activeWallId}
          activeCameraId={activeCameraId}
          viewPreset={viewPreset}
          cameraHeightMm={cameraHeightMm}
          fieldOfViewDegrees={fieldOfViewDegrees}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          cutawayWalls={cutawayWalls}
          cutawayStyle={props.captureFixedDpr != null ? "remove" : "ghost"}
          interactive={interactive}
          renderQuality={viewportQuality}
          renderComposition={props.renderComposition ?? "architectural"}
          renderMode={renderMode}
          lightingQuality={lightingQuality}
          projectLightScale={projectLightScale}
          windowKeyScale={windowKeyScale}
          roomLightScale={props.roomLightScale}
          fitVersion={fitVersion}
          fitMode={fitMode}
          fitSelection={fitSelection}
          frameRun={props.frameRun}
          onSelect={onSelect}
          onSelectOpening={onSelectOpening}
          onSelectWall={onSelectWall}
          selectedLightId={selectedLightId}
          onSelectLight={onSelectLight}
          onMoveLight={props.onMoveLight}
          onClearSelection={onClearSelection}
          onMove={onMove}
          onExitWalkthrough={onExitWalkthrough}
          onMechanismClick={onMechanismClick}
          onWallContextMenu={onWallContextMenu}
          transformTarget={transformTarget}
          onTransformPreview={onTransformPreview}
          onTransformCommit={onTransformCommit}
        />
        {props.overlay}
        </GlbInstancingProvider>
      </ModelViewPreviewProfileProvider>
    </Canvas>
  );
}
