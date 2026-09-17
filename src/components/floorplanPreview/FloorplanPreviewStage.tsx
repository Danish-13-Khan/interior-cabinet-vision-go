import { Bounds, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { FloorplanPreviewMesh } from "./FloorplanPreviewMesh";

function InvalidateOnMount() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    const id = window.setTimeout(() => invalidate(), 80);
    return () => window.clearTimeout(id);
  }, [invalidate]);
  return null;
}

/** Preview-only camera framed to the sidecar GLB (not the compiled shell bounds). */
export function FloorplanPreviewStage({ url }: { url: string }) {
  return (
    <>
      <InvalidateOnMount />
      <color attach="background" args={["#1b1f23"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 12, 4]} intensity={0.95} />
      <Suspense fallback={null}>
        {/* Do not use Bounds `clip` — tight near/far clips large floorplates into fragments. */}
        <Bounds fit observe margin={1.4}>
          <FloorplanPreviewMesh url={url} />
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.49} />
    </>
  );
}
