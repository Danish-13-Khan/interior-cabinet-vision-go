import { Canvas } from "@react-three/fiber";
import { forwardRef } from "react";
import type {
  CompiledLivingRoomScene,
} from "../domain/livingRoom";
import {
  getRenderQualityPreset,
  resolveStudioRenderMode,
} from "../domain/livingRoom";
import type { RenderComposition, RenderQuality } from "../domain/interiorProject";
import type { RenderMode } from "../domain/livingRoom/renderAssetContracts";
import { CompiledSceneRenderer } from "./livingRoomScene/CompiledSceneRenderer";
import {
  RenderCaptureBridge,
  type RenderCaptureHandle,
} from "./livingRoomScene/RenderCaptureBridge";

type LivingRoomRenderCanvasProps = {
  scene: CompiledLivingRoomScene;
  activeCameraId: string;
  quality: RenderQuality;
  composition: RenderComposition;
  renderMode?: RenderMode;
};

const ignoreSelection = () => undefined;
const ignoreMove = () => undefined;

export const LivingRoomRenderCanvas = forwardRef<
  RenderCaptureHandle,
  LivingRoomRenderCanvasProps
>(function LivingRoomRenderCanvas(
  { scene, activeCameraId, quality, composition, renderMode },
  ref,
) {
  const preset = getRenderQualityPreset(quality);
  const mode = renderMode ?? resolveStudioRenderMode(quality);
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, preset.pixelRatio]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [4.3, 2.2, 3.9], fov: 48, near: 0.05, far: 100 }}
    >
      <RenderCaptureBridge
        ref={ref}
        compiledScene={scene}
        quality={quality}
        previewCameraId={activeCameraId}
        previewComposition={composition}
      />
      <CompiledSceneRenderer
        scene={scene}
        selectedIds={[]}
        activeCameraId={activeCameraId}
        snapSizeMm={50}
        showGrid={false}
        cutawayWalls
        interactive={false}
        renderQuality={quality}
        renderComposition={composition}
        renderMode={mode}
        onSelect={ignoreSelection}
        onMove={ignoreMove}
      />
    </Canvas>
  );
});
