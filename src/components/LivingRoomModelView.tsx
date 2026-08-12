import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { InteriorProject, Point3Mm, RenderQuality } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  getActiveLivingRoomStyleId,
  LIVING_ROOM_STYLE_PRESETS,
  getRenderQualityPreset,
  type LivingRoomStyleId,
} from "../domain/livingRoom";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";
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
  const defaultCameraId = scene.cameras.find((camera) => camera.isDefault)?.id
    ?? scene.cameras[0]?.id
    ?? null;
  const [activeCameraId, setActiveCameraId] = useState<string | null>(defaultCameraId);
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>("presentation");
  const quality = getRenderQualityPreset(viewportQuality);
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
    <div className="lr-model-viewport" data-testid="lr-model-viewport">
      <div className="lr-model-controls">
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
          Cutaway walls
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
          <b>{activeObject ? `${activeRotation}°` : "None"}</b>
        </label>
        <button type="button" onClick={() => activeObject && onSetRotation(activeObject.id, activeRotation - 90)} disabled={!activeObject}>
          -90°
        </button>
        <button type="button" onClick={() => activeObject && onSetRotation(activeObject.id, activeRotation + 90)} disabled={!activeObject}>
          +90°
        </button>
        <label>
          Quality
          <select aria-label="Viewport quality" value={viewportQuality} onChange={(event) => setViewportQuality(event.target.value as RenderQuality)}>
            <option value="draft">Draft</option>
            <option value="standard">Balanced</option>
            <option value="presentation">High</option>
          </select>
        </label>
        <span>{scene.nodes.filter((node) => node.sourceObjectId).length} compiled objects</span>
      </div>
      <Canvas
        shadows="percentage"
        dpr={[1, quality.pixelRatio]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [4.3, 2.2, 3.9], fov: 48, near: 0.05, far: 100 }}
        onPointerMissed={() => onSelect(null)}
      >
        <CompiledSceneRenderer
          scene={scene}
          selectedIds={selectedIds}
          activeCameraId={activeCameraId}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          cutawayWalls={cutawayWalls}
          renderQuality={viewportQuality}
          renderMode="preview"
          onSelect={onSelect}
          onMove={onMove}
        />
      </Canvas>
      {diagnostics ? <RenderDiagnosticsPanel report={diagnostics} compact /> : null}
      <aside className="lr-style-palette" aria-label="Interior style presets">
        <header>
          <span>INTERIOR STYLE</span>
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
        <p>{activeStyle.description}</p>
      </aside>
      <div className="lr-model-readout">
        <span>SCENE {scene.fingerprint.slice(-8).toUpperCase()}</span>
        <span>{scene.warnings.length ? `${scene.warnings.length} adapter warning` : `${scene.style.name.toUpperCase()} · ACES · ${scene.style.colorManagement.exposure.toFixed(2)} EV`}</span>
        <span>Drag objects · Left orbit · Right pan · Wheel zoom</span>
      </div>
    </div>
  );
}
