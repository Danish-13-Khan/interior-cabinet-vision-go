import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

export type FloorplanPreviewMeshProps = {
  /** Object URL from acquireFloorplanGlbObjectUrl — source transforms preserved. */
  url: string;
  onReady?: () => void;
};

/**
 * Sidecar GLB as authored. Do not reuse AssetBackedGlbContent — that applies
 * catalog scale, floor-origin normalization, and material/shadow policies.
 *
 * clone(true) shares geometry/materials with the useGLTF cache — never dispose
 * those on unmount or the cached GLB goes blank for Retry / other viewers.
 */
export function FloorplanPreviewMesh({ url, onReady }: FloorplanPreviewMeshProps) {
  const gltf = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      child.frustumCulled = false;
    });
    invalidate();
    onReady?.();
  }, [scene, invalidate, onReady]);

  return <primitive object={scene} />;
}
