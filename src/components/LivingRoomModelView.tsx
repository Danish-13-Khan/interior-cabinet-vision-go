import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { InteriorProject, Point3Mm } from "../domain/interiorProject";
import { compileLivingRoomScene } from "../domain/livingRoom";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";

type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
};

export function LivingRoomModelView({
  project,
  selectedIds,
  snapSizeMm,
  showGrid,
  onSelect,
  onMove,
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const defaultCameraId = scene.cameras.find((camera) => camera.isDefault)?.id
    ?? scene.cameras[0]?.id
    ?? null;
  const [activeCameraId, setActiveCameraId] = useState<string | null>(defaultCameraId);
  const [cutawayWalls, setCutawayWalls] = useState(true);

  return (
    <div className="lr-model-viewport">
      <div className="lr-model-controls">
        <label>
          Camera
          <select value={activeCameraId ?? ""} onChange={(event) => setActiveCameraId(event.target.value || null)}>
            {scene.cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}
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
      <div className="lr-model-readout">
        <span>SCENE {scene.fingerprint.slice(-8).toUpperCase()}</span>
        <span>{scene.warnings.length ? `${scene.warnings.length} adapter warning` : "ALL ADAPTERS READY"}</span>
        <span>Drag objects · Left orbit · Right pan · Wheel zoom</span>
      </div>
    </div>
  );
}

