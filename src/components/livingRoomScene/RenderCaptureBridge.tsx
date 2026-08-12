import { forwardRef, useImperativeHandle } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector2 } from "three";
import type { RenderComposition, RenderQuality } from "../../domain/interiorProject";
import {
  getRenderQualityPreset,
  resolveRenderCameraPose,
  type CompiledLivingRoomScene,
} from "../../domain/livingRoom";

export type RenderCaptureRequest = {
  cameraId: string;
  widthPx: number;
  heightPx: number;
  transparentBackground: boolean;
  composition: RenderComposition;
};

export type RenderCaptureHandle = {
  capturePng: (request: RenderCaptureRequest) => Promise<string>;
};

export const RenderCaptureBridge = forwardRef<
  RenderCaptureHandle,
  {
    compiledScene: CompiledLivingRoomScene;
    quality: RenderQuality;
    previewCameraId: string;
    previewComposition: RenderComposition;
  }
>(function RenderCaptureBridge({
  compiledScene,
  quality,
  previewCameraId,
  previewComposition,
}, ref) {
  const { camera, gl, invalidate, scene, size } = useThree();

  useImperativeHandle(ref, () => ({
    async capturePng(request) {
      const projectCamera = compiledScene.cameras.find(
        (candidate) => candidate.id === request.cameraId,
      );
      if (!projectCamera) throw new Error("The selected render camera is unavailable.");
      const preset = resolveRenderCameraPose(
        projectCamera,
        compiledScene.bounds,
        request.composition,
      );
      if (!(camera instanceof PerspectiveCamera)) {
        throw new Error("Render Studio requires a perspective camera.");
      }

      const oldPosition = camera.position.clone();
      const oldQuaternion = camera.quaternion.clone();
      const oldFov = camera.fov;
      const oldAspect = camera.aspect;
      const oldPixelRatio = gl.getPixelRatio();
      const oldDrawingSize = gl.getSize(new Vector2());
      const oldBackground = scene.background;
      const oldFog = scene.fog;
      const oldClearAlpha = gl.getClearAlpha();
      const qualityPreset = getRenderQualityPreset(quality);
      const textureLimit = gl.capabilities.maxTextureSize;
      const requestedPixels = request.widthPx * request.heightPx;
      const safeScale = Math.min(
        qualityPreset.renderScale,
        textureLimit / request.widthPx,
        textureLimit / request.heightPx,
        Math.sqrt(qualityPreset.maximumRenderPixels / requestedPixels),
      );
      const renderWidth = Math.max(request.widthPx, Math.round(request.widthPx * safeScale));
      const renderHeight = Math.max(request.heightPx, Math.round(request.heightPx * safeScale));

      try {
        camera.position.set(
          preset.position.x / 1000,
          preset.position.y / 1000,
          preset.position.z / 1000,
        );
        camera.fov = preset.fieldOfViewDegrees;
        camera.aspect = request.widthPx / request.heightPx;
        camera.lookAt(
          preset.target.x / 1000,
          preset.target.y / 1000,
          preset.target.z / 1000,
        );
        camera.updateProjectionMatrix();

        if (request.transparentBackground) {
          scene.background = null;
          scene.fog = null;
          gl.setClearAlpha(0);
        }
        gl.setPixelRatio(1);
        gl.setSize(renderWidth, renderHeight, false);
        scene.updateMatrixWorld(true);
        gl.render(scene, camera);

        const output = document.createElement("canvas");
        output.width = request.widthPx;
        output.height = request.heightPx;
        const context = output.getContext("2d");
        if (!context) throw new Error("The browser could not prepare the render output canvas.");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (quality === "presentation") {
          context.filter = "contrast(1.045) saturate(1.035)";
        } else if (quality === "standard") {
          context.filter = "contrast(1.025) saturate(1.02)";
        }
        context.drawImage(gl.domElement, 0, 0, request.widthPx, request.heightPx);
        context.filter = "none";
        if (quality === "presentation" && !request.transparentBackground) {
          const vignette = context.createRadialGradient(
            request.widthPx / 2,
            request.heightPx * 0.48,
            Math.min(request.widthPx, request.heightPx) * 0.22,
            request.widthPx / 2,
            request.heightPx / 2,
            Math.max(request.widthPx, request.heightPx) * 0.72,
          );
          vignette.addColorStop(0, "rgba(12,18,16,0)");
          vignette.addColorStop(0.68, "rgba(12,18,16,0.01)");
          vignette.addColorStop(1, "rgba(12,18,16,0.12)");
          context.fillStyle = vignette;
          context.fillRect(0, 0, request.widthPx, request.heightPx);
        }
        return output.toDataURL("image/png", 1);
      } finally {
        const previewProjectCamera = compiledScene.cameras.find(
          (candidate) => candidate.id === previewCameraId,
        );
        const previewCamera = previewProjectCamera
          ? resolveRenderCameraPose(
              previewProjectCamera,
              compiledScene.bounds,
              previewComposition,
            )
          : null;
        if (previewCamera) {
          camera.position.set(
            previewCamera.position.x / 1000,
            previewCamera.position.y / 1000,
            previewCamera.position.z / 1000,
          );
          camera.fov = previewCamera.fieldOfViewDegrees;
          camera.lookAt(
            previewCamera.target.x / 1000,
            previewCamera.target.y / 1000,
            previewCamera.target.z / 1000,
          );
        } else {
          camera.position.copy(oldPosition);
          camera.quaternion.copy(oldQuaternion);
          camera.fov = oldFov;
        }
        camera.aspect = oldAspect;
        camera.updateProjectionMatrix();
        scene.background = oldBackground;
        scene.fog = oldFog;
        gl.setClearAlpha(oldClearAlpha);
        gl.setPixelRatio(oldPixelRatio);
        gl.setSize(oldDrawingSize.x || size.width, oldDrawingSize.y || size.height, false);
        invalidate();
      }
    },
  }), [
    camera,
    compiledScene.bounds,
    compiledScene.cameras,
    gl,
    invalidate,
    previewCameraId,
    previewComposition,
    quality,
    scene,
    size.height,
    size.width,
  ]);

  return null;
});
