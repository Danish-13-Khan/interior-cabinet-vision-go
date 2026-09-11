import { Canvas } from "@react-three/fiber";
import type { Point3Mm, RenderQuality } from "../../domain/interiorProject";
import type {
  CompiledLivingRoomScene,
  ModelViewPresetId,
} from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import {
  MODEL_VIEW_MSAA,
  resolveModelViewDprRange,
} from "../../domain/livingRoom/modelViewSharpness";
import { resolveModelViewCameraFarMeters } from "../../domain/livingRoom/modelViewCameraEase";
import { ModelViewPreviewProfileProvider } from "../../rendering/ModelViewPreviewProfile";
import { CompiledSceneRenderer } from "./CompiledSceneRenderer";
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
  onMove: (objectId: string, position: Point3Mm) => void;
  onExitWalkthrough: () => void;
  onMechanismClick: (objectId: string, primitiveId: string) => void;
  onWallContextMenu?: (wallId: string, point: { x: number; y: number }) => void;
  transformTarget?: ModelTransformTarget | null;
  onTransformPreview?: (target: ModelTransformTarget, position: Point3Mm) => Point3Mm;
  onTransformCommit?: (target: ModelTransformTarget, position: Point3Mm) => void;
};

export function ModelViewScene(props: ModelViewSceneProps) {
  const {
    scene, viewportQuality, renderMode, lightingQuality, projectLightScale,
    windowKeyScale, selectedIds, activeOpeningId, activeWallId, activeCameraId, viewPreset,
    cameraHeightMm, fieldOfViewDegrees, snapSizeMm, showGrid, cutawayWalls,
    interactive = true,
    fitVersion = 0, fitMode = "room", fitSelection, onClearSelection, onSelect,
    onSelectOpening, onSelectWall, onMove, onExitWalkthrough, onMechanismClick,
    onWallContextMenu, transformTarget, onTransformPreview, onTransformCommit,
  } = props;
  const roomSpanMeters = Math.max(
    scene.bounds.size.widthMm,
    scene.bounds.size.depthMm,
  ) / 1000;
  const cameraFar = resolveModelViewCameraFarMeters(roomSpanMeters);

  return (
    <Canvas
      shadows="percentage"
      dpr={resolveModelViewDprRange(viewportQuality)}
      gl={{ antialias: MODEL_VIEW_MSAA, preserveDrawingBuffer: true }}
      camera={{ position: [0, 1.5, 2], fov: 42, near: 0.05, far: cameraFar }}
      onPointerMissed={interactive ? onClearSelection : undefined}
    >
      <ModelViewPreviewProfileProvider quality={viewportQuality}>
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
          interactive={interactive}
          renderQuality={viewportQuality}
          renderComposition="architectural"
          renderMode={renderMode}
          lightingQuality={lightingQuality}
          projectLightScale={projectLightScale}
          windowKeyScale={windowKeyScale}
          fitVersion={fitVersion}
          fitMode={fitMode}
          fitSelection={fitSelection}
          onSelect={onSelect}
          onSelectOpening={onSelectOpening}
          onSelectWall={onSelectWall}
          onClearSelection={onClearSelection}
          onMove={onMove}
          onExitWalkthrough={onExitWalkthrough}
          onMechanismClick={onMechanismClick}
          onWallContextMenu={onWallContextMenu}
          transformTarget={transformTarget}
          onTransformPreview={onTransformPreview}
          onTransformCommit={onTransformCommit}
        />
      </ModelViewPreviewProfileProvider>
    </Canvas>
  );
}
