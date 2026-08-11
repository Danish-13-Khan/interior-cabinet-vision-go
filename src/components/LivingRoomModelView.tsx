import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { InteriorProject, Point3Mm } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  getActiveLivingRoomStyleId,
  LIVING_ROOM_STYLE_PRESETS,
  type LivingRoomStyleId,
} from "../domain/livingRoom";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";

type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
};

export function LivingRoomModelView({
  project,
  selectedIds,
  snapSizeMm,
  showGrid,
  onSelect,
  onMove,
  onApplyStyle,
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const defaultCameraId = scene.cameras.find((camera) => camera.isDefault)?.id
    ?? scene.cameras[0]?.id
    ?? null;
  const [activeCameraId, setActiveCameraId] = useState<string | null>(defaultCameraId);
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;

  return (
    <div className="lr-model-viewport">
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
        <span>{scene.nodes.filter((node) => node.sourceObjectId).length} compiled objects</span>
      </div>
      <Canvas
        shadows
        dpr={[1, 1.75]}
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
          onSelect={onSelect}
          onMove={onMove}
        />
      </Canvas>
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
