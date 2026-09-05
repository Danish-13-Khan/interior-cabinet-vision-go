import type { ShellBox } from "./buildRoomShell";

const COLORS: Record<ShellBox["kind"], string> = {
  floor: "#3d4a42",
  wall: "#c5cdd4",
  opening: "#6db3c7",
};

type Props = { boxes: ShellBox[] };

export function RoomShellMeshes({ boxes }: Props) {
  return (
    <group>
      {boxes.map((box) => (
        <mesh
          key={box.id}
          position={box.position}
          rotation={[0, box.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={box.size} />
          <meshStandardMaterial
            color={
              box.kind === "opening"
                ? box.openingKind === "door"
                  ? "#c9a227"
                  : COLORS.opening
                : COLORS[box.kind]
            }
            transparent={box.kind === "opening"}
            opacity={box.kind === "opening" ? 0.85 : 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
