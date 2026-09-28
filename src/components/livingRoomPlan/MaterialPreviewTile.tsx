import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import type { Group } from "three";
import type { InteriorProject } from "../../domain/interiorProject";
import { compileMaterials } from "../../domain/livingRoom/sceneCompiler";
import { CompiledMaterialView } from "../livingRoomScene/CompiledMaterialView";
import { RendererColorPipeline } from "../livingRoomScene/RendererColorPipeline";
import { StudioEnvironment } from "../livingRoomScene/StudioEnvironment";

function SlowTurn({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime / 2.4) * 0.35;
  });
  return <group ref={group}>{children}</group>;
}

/** Live 3D preview of one finish on a door panel (hovered swatch, else applied). */
export function MaterialPreviewTile({ project, materialId, label }: {
  project: InteriorProject;
  materialId: string | null;
  label: string;
}) {
  const materials = useMemo(() => compileMaterials(project), [project]);
  const material = materials.find((item) => item.id === materialId) ?? null;
  return (
    <figure className="lr-material-preview" data-testid="material-preview" data-material-id={materialId ?? ""}>
      {material ? (
        <Canvas dpr={[1, 2]} frameloop="always" camera={{ position: [0, 0.05, 1.25], fov: 34 }}
          gl={{ antialias: true }}>
          <color attach="background" args={["#f3f4f1"]} />
          <RendererColorPipeline exposure={1} />
          <StudioEnvironment />
          <directionalLight position={[1.5, 2, 2]} intensity={1.4} />
          <SlowTurn>
            <mesh>
              <boxGeometry args={[0.6, 0.72, 0.02]} />
              <CompiledMaterialView material={material} primitiveId={`preview-${material.id}`} renderMode="preview" />
            </mesh>
          </SlowTurn>
        </Canvas>
      ) : <span className="lr-material-preview-empty">Pick a swatch to preview it in 3D</span>}
      <figcaption>{label}</figcaption>
    </figure>
  );
}
