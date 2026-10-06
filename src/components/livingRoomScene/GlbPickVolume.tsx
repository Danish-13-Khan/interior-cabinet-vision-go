import type { ThreeEvent } from "@react-three/fiber";
import type { ModelNativeSizeMm } from "../../domain/livingRoom/renderAssetContracts";

/** Invisible stand-in so a batched model still receives picks on its own node. */
export function GlbPickVolume({
  target,
  onPointerDown,
}: {
  target?: ModelNativeSizeMm;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const width = (target?.widthMm ?? 1000) / 1000;
  const height = (target?.heightMm ?? 1000) / 1000;
  const depth = (target?.depthMm ?? 1000) / 1000;
  return (
    <mesh position={[0, height / 2, 0]} onPointerDown={onPointerDown}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
