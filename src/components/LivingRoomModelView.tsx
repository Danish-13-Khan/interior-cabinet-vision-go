import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { InteriorProject, Point3Mm, RenderQuality } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  describePresetHonesty,
  getActiveLivingRoomStyleId,
  getCabinetMechanismState,
  getModelViewDefaultPresetId,
  getRenderQualityPreset,
  LIVING_ROOM_STYLE_PRESETS,
  listModelViewRenderPresets,
  mechanismAllPatch,
  mechanismFrontIndex,
  mechanismPanelPatch,
  modelViewNavHint,
  preferModelViewCameraId,
  resolveModelViewCameraOverrides,
  resolveStudioRenderMode,
  type LivingRoomStyleId,
  type ModelViewPresetId,
} from "../domain/livingRoom";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { CabinetMechanismPanel } from "./livingRoomScene/CabinetMechanismPanel";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";
import { ModelViewStylePalette } from "./livingRoomScene/ModelViewStylePalette";
import { ModelViewToolbar } from "./livingRoomScene/ModelViewToolbar";
import { RenderDiagnosticsPanel } from "./livingRoomScene/RenderDiagnosticsPanel";

type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
};

export function LivingRoomModelView({
  project,
  selectedIds,
  snapSizeMm,
  showGrid,
  onSelect,
  onMove,
  onSetRotation,
  onApplyStyle,
  onSetParameters,
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const entryCameraId = preferModelViewCameraId(scene.cameras);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(entryCameraId);
  const [viewPreset, setViewPreset] = useState<ModelViewPresetId>("dollhouse");
  const [cameraHeightMm, setCameraHeightMm] = useState(3300);
  const [fieldOfViewDegrees, setFieldOfViewDegrees] = useState(42);
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(getModelViewDefaultPresetId());
  const modelPresets = listModelViewRenderPresets();
  const quality = getRenderQualityPreset(viewportQuality);
  const renderMode = resolveStudioRenderMode(viewportQuality);
  const honesty = describePresetHonesty(viewportQuality, renderMode);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const activeObject = selectedIds.length === 1
    ? project.objects.find((object) => object.id === selectedIds[0])
    : null;
  const activeRotation = activeObject ? Math.round(activeObject.rotation.y) : 0;
  const activeCamera = scene.cameras.find((camera) => camera.id === activeCameraId)
    ?? scene.cameras[0]
    ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(viewPreset, cameraHeightMm, fieldOfViewDegrees);

  return (
    <div className="lr-model-viewport is-presence" data-testid="lr-model-viewport">
      <ModelViewToolbar
        viewPreset={viewPreset}
        cameraHeightMm={cameraHeightMm}
        fieldOfViewDegrees={fieldOfViewDegrees}
        activeCameraId={activeCameraId}
        cameras={scene.cameras}
        activeStyleId={activeStyleId}
        cutawayWalls={cutawayWalls}
        activeRotation={activeRotation}
        hasActiveObject={Boolean(activeObject)}
        viewportQuality={viewportQuality}
        modelPresets={modelPresets}
        honesty={honesty}
        onViewPreset={setViewPreset}
        onCameraHeightMm={setCameraHeightMm}
        onFieldOfViewDegrees={setFieldOfViewDegrees}
        onActiveCameraId={setActiveCameraId}
        onApplyStyle={onApplyStyle}
        onCutawayWalls={setCutawayWalls}
        onSetRotation={(rotationY) => {
          if (activeObject) onSetRotation(activeObject.id, rotationY);
        }}
        onViewportQuality={setViewportQuality}
      />
      <Canvas
        shadows="percentage"
        dpr={[1, quality.pixelRatio]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 1.5, 2], fov: 42, near: 0.05, far: 100 }}
        onPointerMissed={() => onSelect(null)}
      >
        <CompiledSceneRenderer
          scene={scene}
          selectedIds={selectedIds}
          activeCameraId={activeCameraId}
          viewPreset={viewPreset}
          cameraHeightMm={cameraOverrides.cameraHeightMm}
          fieldOfViewDegrees={cameraOverrides.fieldOfViewDegrees}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          cutawayWalls={cutawayWalls}
          renderQuality={viewportQuality}
          renderComposition="architectural"
          renderMode={renderMode}
          onSelect={onSelect}
          onMove={onMove}
          onMechanismClick={(objectId, primitiveId) => {
            const object = project.objects.find((item) => item.id === objectId);
            const state = object ? getCabinetMechanismState(object) : null;
            const index = mechanismFrontIndex(primitiveId);
            if (state && index !== null && index < state.count) {
              onSetParameters(objectId, mechanismPanelPatch(index, !state.open[index]));
            }
          }}
        />
      </Canvas>
      {diagnostics ? <RenderDiagnosticsPanel report={diagnostics} compact /> : null}
      <CabinetMechanismPanel
        object={activeObject ?? null}
        onChange={onSetParameters}
        onSoftClose={(object) => {
          const state = getCabinetMechanismState(object);
          if (!state) return;
          onSetParameters(object.id, mechanismAllPatch(state, true));
          window.setTimeout(() => onSetParameters(object.id, mechanismAllPatch(state, false)), 650);
        }}
      />
      <ModelViewStylePalette
        activeStyleId={activeStyleId}
        activeStyleName={activeStyle.name}
        onApplyStyle={onApplyStyle}
      />
      <div className="lr-model-readout">
        <span>{honesty.shortBadge} · {scene.style.colorManagement.exposure.toFixed(2)} EV</span>
        <span>{modelViewNavHint(viewPreset)}</span>
      </div>
    </div>
  );
}
