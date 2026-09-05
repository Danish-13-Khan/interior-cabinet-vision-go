import { resolveMaterial } from "./materials";
import type { ArchShellBox } from "./buildArchShell";

type Props = {
  boxes: ArchShellBox[];
  selectedId: string | null;
  onSelect?: (entityId: string) => void;
};

export function ArchShellMeshes({ boxes, selectedId, onSelect }: Props) {
  return (
    <group>
      {boxes.map((box) => {
        const mat = resolveMaterial(box.materialId);
        const selected = Boolean(selectedId && box.entityId === selectedId);
        const isFrame = box.kind === "frame";
        return (
          <mesh
            key={box.id}
            position={box.position}
            rotation={[0, box.rotationY, 0]}
            castShadow={!isFrame}
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              if (box.entityId && onSelect) onSelect(box.entityId);
            }}
          >
            <boxGeometry args={box.size} />
            <meshStandardMaterial
              color={selected ? "#f0a050" : mat.color}
              transparent={box.kind === "opening" || isFrame}
              opacity={isFrame ? 0.25 : box.kind === "opening" ? 0.85 : 1}
              roughness={mat.roughness}
              metalness={0.05}
              wireframe={isFrame}
            />
          </mesh>
        );
      })}
    </group>
  );
}
