import { Canvas } from "@react-three/fiber";
import type { Point3Mm, RenderQuality } from "../../domain/interiorProject";
import type {
  CompiledLivingRoomScene,
  ModelViewPresetId,
} from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { RenderQualityPreset } from "../../domain/livingRoom/renderStudio";
import { ModelViewPreviewProfileProvider } from "../../rendering/ModelViewPreviewProfile";
import { CompiledSceneRenderer } from "./CompiledSceneRenderer";

type ModelViewSceneProps = {
  scene: CompiledLivingRoomScene;
  quality: RenderQualityPreset;
  viewportQuality: RenderQuality;
  renderMode: RenderMode;
  lightingQuality: EnvironmentLightingQuality;
  projectLightScale: number;
  windowKeyScale: number;
  selectedIds: string[];
  activeOpeningId: string | null;
  activeCameraId: string | null;
  viewPreset: ModelViewPresetId;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  snapSizeMm: number;
  showGrid: boolean;
  cutawayWalls: boolean;
  onClearSelection: () => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onExitWalkthrough: () => void;
  onMechanismClick: (objectId: string, primitiveId: string) => void;
};

export function ModelViewScene({
  scene,
  quality,
  viewportQuality,
  renderMode,
  lightingQuality,
  projectLightScale,
  windowKeyScale,
  selectedIds,
  activeOpeningId,
  activeCameraId,
  viewPreset,
  cameraHeightMm,
  fieldOfViewDegrees,
  snapSizeMm,
  showGrid,
  cutawayWalls,
  onClearSelection,
  onSelect,
  onSelectOpening,
  onMove,
  onExitWalkthrough,
  onMechanismClick,
}: ModelViewSceneProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, quality.pixelRatio]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 1.5, 2], fov: 42, near: 0.05, far: 100 }}
      onPointerMissed={onClearSelection}
    >
      <ModelViewPreviewProfileProvider quality={viewportQuality}>
        <CompiledSceneRenderer
          scene={scene}
          selectedIds={selectedIds}
          selectedOpeningId={activeOpeningId}
          activeCameraId={activeCameraId}
          viewPreset={viewPreset}
          cameraHeightMm={cameraHeightMm}
          fieldOfViewDegrees={fieldOfViewDegrees}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          cutawayWalls={cutawayWalls}
          renderQuality={viewportQuality}
          renderComposition="architectural"
          renderMode={renderMode}
          lightingQuality={lightingQuality}
          projectLightScale={projectLightScale}
          windowKeyScale={windowKeyScale}
          onSelect={onSelect}
          onSelectOpening={onSelectOpening}
          onClearSelection={onClearSelection}
          onMove={onMove}
          onExitWalkthrough={onExitWalkthrough}
          onMechanismClick={onMechanismClick}
        />
      </ModelViewPreviewProfileProvider>
    </Canvas>
  );
}
