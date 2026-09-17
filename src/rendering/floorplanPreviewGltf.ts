import { useGLTF } from "@react-three/drei";

/** Drop drei's URL cache after revokeObjectURL (hook-safe; not domain). */
export function clearFloorplanPreviewGltf(url: string) {
  try {
    useGLTF.clear(url);
  } catch {
    /* ignore */
  }
}
