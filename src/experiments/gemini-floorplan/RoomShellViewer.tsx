import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { buildRoomShell } from "./buildRoomShell";
import type { GeometryViewMode } from "./geometryMode";
import type { GeminiFloorProposal } from "./proposalTypes";
import { RoomShellMeshes } from "./RoomShellMeshes";

type Props = {
  proposal: GeminiFloorProposal | null;
  geometryMode?: GeometryViewMode;
};

function geometryFingerprint(proposal: GeminiFloorProposal): string {
  return proposal.walls
    .map(
      (w) =>
        `${w.id}:${w.a.x.toFixed(0)},${w.a.y.toFixed(0)}-${w.b.x.toFixed(0)},${w.b.y.toFixed(0)}`,
    )
    .join("|");
}

export function RoomShellViewer({ proposal, geometryMode }: Props) {
  const shell = useMemo(
    () => (proposal ? buildRoomShell(proposal) : null),
    [proposal],
  );
  const fingerprint = proposal ? geometryFingerprint(proposal) : "empty";
  const wallCount = proposal?.walls.length ?? 0;

  return (
    <section className="gfl-panel gfl-3d" aria-label="3D room shell">
      <header className="gfl-panel__head">
        <h2>3D shell</h2>
        <p>
          {shell
            ? `Orbit · ${wallCount} walls${geometryMode ? ` · ${geometryMode}` : ""} · doors gold · windows teal`
            : "Load a proposal (Vision or offline) to build the room shell."}
        </p>
      </header>
      <div className="gfl-3d__stage gfl-3d__stage--live">
        {shell ? (
          <Canvas
            key={fingerprint}
            shadows
            camera={{
              position: shell.cameraPosition,
              fov: 45,
              near: 0.05,
              far: 200,
            }}
          >
            <color attach="background" args={["#121518"]} />
            <ambientLight intensity={0.55} />
            <directionalLight
              castShadow
              intensity={1.1}
              position={[6, 10, 4]}
              shadow-mapSize={[1024, 1024]}
            />
            <RoomShellMeshes boxes={shell.boxes} />
            <OrbitControls
              makeDefault
              target={shell.center}
              enableDamping
              maxPolarAngle={Math.PI * 0.49}
            />
            <gridHelper args={[20, 20, "#2c333a", "#232830"]} position={[0, 0, 0]} />
          </Canvas>
        ) : (
          <>
            <div className="gfl-3d__grid" aria-hidden />
            <p>No mesh yet — run Vision or load an offline fixture</p>
          </>
        )}
      </div>
    </section>
  );
}
