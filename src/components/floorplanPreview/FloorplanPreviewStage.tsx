import { Bounds, OrbitControls } from "@react-three/drei";
import { FloorplanPreviewMesh } from "./FloorplanPreviewMesh";

/** Preview-only camera framed to the sidecar GLB (not the compiled shell bounds). */
export function FloorplanPreviewStage({ url }: { url: string }) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 12, 4]} intensity={0.95} />
      <Bounds fit clip observe margin={1.25}>
        <FloorplanPreviewMesh url={url} />
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
}
