import { Canvas } from "@react-three/fiber";
import { forwardRef } from "react";
import type {
  CompiledLivingRoomScene,
} from "../domain/livingRoom";
import type { RenderQuality } from "../domain/interiorProject";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";
import {
  RenderCaptureBridge,
  type RenderCaptureHandle,
} from "./livingRoomScene/RenderCaptureBridge";

type LivingRoomRenderCanvasProps = {
  scene: CompiledLivingRoomScene;
  activeCameraId: string;
  quality: RenderQuality;
};

const ignoreSelection = () => undefined;
const ignoreMove = () => undefined;

export const LivingRoomRenderCanvas = forwardRef<
  RenderCaptureHandle,
  LivingRoomRenderCanvasProps
>(function LivingRoomRenderCanvas({ scene, activeCameraId, quality }, ref) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [4.3, 2.2, 3.9], fov: 48, near: 0.05, far: 100 }}
    >
      <RenderCaptureBridge ref={ref} compiledScene={scene} />
      <CompiledSceneRenderer
        scene={scene}
        selectedIds={[]}
        activeCameraId={activeCameraId}
        snapSizeMm={50}
        showGrid={false}
        cutawayWalls
        interactive={false}
        renderQuality={quality}
        onSelect={ignoreSelection}
        onMove={ignoreMove}
      />
    </Canvas>
  );
});
