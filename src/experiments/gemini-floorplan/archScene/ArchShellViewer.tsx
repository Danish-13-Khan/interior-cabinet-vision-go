import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import type { ArchitecturalScene } from "./archSceneTypes";
import { ArchShellMeshes } from "./ArchShellMeshes";
import { buildArchShell } from "./buildArchShell";
import { lightingForPreset } from "./materials";

type Props = {
  scene: ArchitecturalScene | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ArchShellViewer({ scene, selectedId, onSelect }: Props) {
  const boxes = useMemo(() => (scene ? buildArchShell(scene) : []), [scene]);
  const light = lightingForPreset(scene?.lightingPreset ?? "studio");
  const center: [number, number, number] = useMemo(() => {
    if (!boxes.length) return [0, 1, 0];
    const xs = boxes.map((b) => b.position[0]);
    const zs = boxes.map((b) => b.position[2]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      1.2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    ];
  }, [boxes]);

  return (
    <section className="gfl-panel gfl-3d" aria-label="Architectural 3D shell">
      <header className="gfl-panel__head">
        <h2>3D arch shell</h2>
        <p>
          {scene
            ? `Phases 11–13 · ${boxes.length} meshes · light ${scene.lightingPreset} · click to select`
            : "Load a proposal to build the architectural shell."}
        </p>
      </header>
      <div className="gfl-3d__stage gfl-3d__stage--live">
        {scene && boxes.length ? (
          <Canvas
            key={`${scene.walls.length}-${scene.openings.length}-${scene.lightingPreset}-${scene.skirtingMm}`}
            shadows
            camera={{ position: [center[0] + 6, 5, center[2] + 6], fov: 45, near: 0.05, far: 200 }}
          >
            <color attach="background" args={["#121518"]} />
            <ambientLight intensity={light.ambient} />
            <directionalLight
              castShadow
              intensity={light.key}
              color={light.color}
              position={[6, 10, 4]}
              shadow-mapSize={[1024, 1024]}
            />
            <hemisphereLight args={["#dfe8f0", "#2a3038", 0.35]} />
            <ArchShellMeshes boxes={boxes} selectedId={selectedId} onSelect={onSelect} />
            <OrbitControls makeDefault target={center} enableDamping maxPolarAngle={Math.PI * 0.49} />
            <gridHelper args={[20, 20, "#2c333a", "#232830"]} />
          </Canvas>
        ) : (
          <>
            <div className="gfl-3d__grid" aria-hidden />
            <p>No arch mesh yet</p>
          </>
        )}
      </div>
    </section>
  );
}
