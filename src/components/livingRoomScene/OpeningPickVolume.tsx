import { type ThreeEvent } from "@react-three/fiber";
import type { CompiledPrimitive } from "../../domain/livingRoom";

const MIN_PICK_DEPTH_M = 0.18;

function pickBox(primitives: CompiledPrimitive[]) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const primitive of primitives) {
    if (!("sizeMm" in primitive)) continue;
    const hx = primitive.sizeMm.width / 2000;
    const hy = primitive.sizeMm.height / 2000;
    const hz = primitive.sizeMm.depth / 2000;
    const x = primitive.positionMm.x / 1000;
    const y = primitive.positionMm.y / 1000;
    const z = primitive.positionMm.z / 1000;
    minX = Math.min(minX, x - hx);
    maxX = Math.max(maxX, x + hx);
    minY = Math.min(minY, y - hy);
    maxY = Math.max(maxY, y + hy);
    minZ = Math.min(minZ, z - hz);
    maxZ = Math.max(maxZ, z + hz);
  }
  if (!Number.isFinite(minX)) return null;
  return {
    position: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2] as const,
    size: [Math.max(0.08, maxX - minX), Math.max(0.08, maxY - minY), Math.max(MIN_PICK_DEPTH_M, maxZ - minZ)] as const,
  };
}

/** Invisible slab that stands proud of the host wall so thin openings stay pickable. */
export function OpeningPickVolume({
  primitives,
  onPointerDown,
}: {
  primitives: CompiledPrimitive[];
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const box = pickBox(primitives);
  if (!box) return null;
  return (
    <mesh
      position={[...box.position]}
      userData={{ primitiveId: "opening-pick" }}
      onPointerDown={onPointerDown}
    >
      <boxGeometry args={[...box.size]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
