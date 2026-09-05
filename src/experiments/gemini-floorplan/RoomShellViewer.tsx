import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { buildRoomShell } from "./buildRoomShell";
import type { GeminiFloorProposal } from "./proposalTypes";
import { RoomShellMeshes } from "./RoomShellMeshes";

type Props = { proposal: GeminiFloorProposal | null };

export function RoomShellViewer({ proposal }: Props) {
  const shell = useMemo(
    () => (proposal ? buildRoomShell(proposal) : null),
    [proposal],
  );

  return (
    <section className="gfl-panel gfl-3d" aria-label="3D room shell">
      <header className="gfl-panel__head">
        <h2>3D shell</h2>
        <p>
          {shell
            ? "Orbit to inspect · doors gold · windows teal · same JSON → same mesh"
            : "Load a proposal (Vision or offline) to build the room shell."}
        </p>
      </header>
      <div className="gfl-3d__stage gfl-3d__stage--live">
        {shell ? (
          <Canvas
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
