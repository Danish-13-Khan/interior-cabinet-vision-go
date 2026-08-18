import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { InteriorProject, Point3Mm, RenderQuality } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  describePresetHonesty,
  getActiveLivingRoomStyleId,
  getModelViewDefaultPresetId,
  getRenderQualityPreset,
  LIVING_ROOM_STYLE_PRESETS,
  listModelViewRenderPresets,
  MODEL_VIEW_PRESETS,
  preferModelViewCameraId,
  resolveStudioRenderMode,
  type LivingRoomStyleId,
  type ModelViewPresetId,
} from "../domain/livingRoom";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";
import { RenderDiagnosticsPanel } from "./livingRoomScene/RenderDiagnosticsPanel";
import { RenderPresetHonestyBadge } from "./livingRoomScene/RenderPresetHonestyBadge";

type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
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
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const entryCameraId = preferModelViewCameraId(scene.cameras);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(entryCameraId);
  const [viewPreset, setViewPreset] = useState<ModelViewPresetId>("orbit");
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(
    getModelViewDefaultPresetId(),
  );
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

  return (
    <div className="lr-model-viewport is-presence" data-testid="lr-model-viewport">
      <div className="lr-model-controls">
        <div className="lr-view-presets" aria-label="3D camera views">
          {MODEL_VIEW_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={viewPreset === preset.id ? "is-active" : ""}
              onClick={() => setViewPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label>
          Camera
          <select value={activeCameraId ?? ""} onChange={(event) => setActiveCameraId(event.target.value || null)}>
            {scene.cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}
          </select>
        </label>
        <label>
          Style
          <select
            aria-label="Interior style"
            value={activeStyleId}
            onChange={(event) => onApplyStyle(event.target.value as LivingRoomStyleId)}
          >
            {LIVING_ROOM_STYLE_PRESETS.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
          </select>
        </label>
        <button type="button" className={cutawayWalls ? "is-active" : ""} onClick={() => setCutawayWalls((current) => !current)}>
          Cutaway
        </button>
        <label>
          Rotate
          <input
            aria-label="Selected object rotation"
            type="range"
            min="0"
            max="345"
            step="15"
            value={activeRotation}
            disabled={!activeObject}
            onChange={(event) => {
              if (activeObject) onSetRotation(activeObject.id, Number(event.target.value));
            }}
          />
          <b>{activeObject ? `${activeRotation}°` : "—"}</b>
        </label>
        <button type="button" onClick={() => activeObject && onSetRotation(activeObject.id, activeRotation - 90)} disabled={!activeObject}>
          -90°
        </button>
        <button type="button" onClick={() => activeObject && onSetRotation(activeObject.id, activeRotation + 90)} disabled={!activeObject}>
          +90°
        </button>
        <label>
          Quality
          <select
            aria-label="Viewport quality"
            value={viewportQuality}
            onChange={(event) => setViewportQuality(event.target.value as RenderQuality)}
          >
            {modelPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}{preset.id === "draft" ? " · Fast" : ""}
              </option>
            ))}
          </select>
        </label>
        <RenderPresetHonestyBadge honesty={honesty} compact />
      </div>
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
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          cutawayWalls={cutawayWalls}
          renderQuality={viewportQuality}
          renderComposition="architectural"
          renderMode={renderMode}
          onSelect={onSelect}
          onMove={onMove}
        />
      </Canvas>
      {diagnostics ? <RenderDiagnosticsPanel report={diagnostics} compact /> : null}
      <aside className="lr-style-palette" aria-label="Interior style presets">
        <header>
          <span>STYLE</span>
          <strong>{activeStyle.name}</strong>
        </header>
        <div>
          {LIVING_ROOM_STYLE_PRESETS.map((style) => (
            <button
              type="button"
              key={style.id}
              className={style.id === activeStyleId ? "is-active" : ""}
              onClick={() => onApplyStyle(style.id)}
              aria-label={`Apply ${style.name}`}
            >
              <span className="lr-style-swatches">
                {style.swatches.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
              </span>
              <span>{style.name}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="lr-model-readout">
        <span>{honesty.shortBadge} · {scene.style.colorManagement.exposure.toFixed(2)} EV</span>
        <span>Orbit · Pan · Zoom · Drag to place</span>
      </div>
    </div>
  );
}
