import { forwardRef, useImperativeHandle } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import type { RenderComposition, RenderQuality } from "../../domain/interiorProject";
import {
  getRenderPresetBehavior,
  getRenderQualityPreset,
  resolveHeroCaptureTuning,
  resolveHeroRenderScale,
  resolveRenderCameraPose,
  resolveStudioRenderMode,
  type CompiledLivingRoomScene,
} from "../../domain/livingRoom";
import { drawHeroVignette } from "../../rendering/export/heroExportPolish";
import { beginSizedGlCapture } from "../../rendering/export/webglCaptureSetup";
import { captureStillSupportMaps } from "../../rendering/export/stillSupportPasses";

export type RenderCaptureRequest = {
  cameraId: string;
  widthPx: number;
  heightPx: number;
  transparentBackground: boolean;
  composition: RenderComposition;
};

export type StillCaptureBundle = {
  heroPng: string;
  depthPng: string;
  normalPng: string;
  materialIdPng: string;
  materialPalette: { materialId: string; r: number; g: number; b: number }[];
};

export type RenderCaptureHandle = {
  capturePng: (request: RenderCaptureRequest) => Promise<string>;
  captureStillBundle: (request: RenderCaptureRequest) => Promise<StillCaptureBundle>;
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

  useImperativeHandle(ref, () => {
    function poseCamera(request: RenderCaptureRequest) {
      const projectCamera = compiledScene.cameras.find((item) => item.id === request.cameraId);
      if (!projectCamera) throw new Error("The selected render camera is unavailable.");
      if (!(camera instanceof PerspectiveCamera)) {
        throw new Error("Render Studio requires a perspective camera.");
      }
      const captureMode = resolveStudioRenderMode(quality);
      const preset = resolveRenderCameraPose(
        projectCamera,
        compiledScene.bounds,
        request.composition,
        captureMode,
      );
      const oldPosition = camera.position.clone();
      const oldQuaternion = camera.quaternion.clone();
      const oldFov = camera.fov;
      const oldAspect = camera.aspect;
      camera.position.set(preset.position.x / 1000, preset.position.y / 1000, preset.position.z / 1000);
      camera.fov = preset.fieldOfViewDegrees;
      camera.aspect = request.widthPx / request.heightPx;
      camera.lookAt(preset.target.x / 1000, preset.target.y / 1000, preset.target.z / 1000);
      camera.updateProjectionMatrix();
      const qualityPreset = getRenderQualityPreset(quality);
      const captureTuning = resolveHeroCaptureTuning(captureMode, quality);
      const textureLimit = gl.capabilities.maxTextureSize;
      const requestedPixels = request.widthPx * request.heightPx;
      const safeScale = Math.min(
        resolveHeroRenderScale(captureMode, quality),
        textureLimit / request.widthPx,
        textureLimit / request.heightPx,
        Math.sqrt(qualityPreset.maximumRenderPixels / requestedPixels),
      );
      return {
        captureMode,
        captureTuning,
        renderWidth: Math.max(request.widthPx, Math.round(request.widthPx * safeScale)),
        renderHeight: Math.max(request.heightPx, Math.round(request.heightPx * safeScale)),
        restorePose: () => {
          const previewProjectCamera = compiledScene.cameras.find((item) => item.id === previewCameraId);
          const preview = previewProjectCamera
            ? resolveRenderCameraPose(
                previewProjectCamera,
                compiledScene.bounds,
                previewComposition,
                captureMode,
              )
            : null;
          if (preview) {
            camera.position.set(preview.position.x / 1000, preview.position.y / 1000, preview.position.z / 1000);
            camera.fov = preview.fieldOfViewDegrees;
            camera.lookAt(preview.target.x / 1000, preview.target.y / 1000, preview.target.z / 1000);
          } else {
            camera.position.copy(oldPosition);
            camera.quaternion.copy(oldQuaternion);
            camera.fov = oldFov;
          }
          camera.aspect = oldAspect;
          camera.updateProjectionMatrix();
        },
      };
    }

    function beautyPng(request: RenderCaptureRequest, captureTuning: ReturnType<typeof resolveHeroCaptureTuning>) {
      gl.render(scene, camera);
      const output = document.createElement("canvas");
      output.width = request.widthPx;
      output.height = request.heightPx;
      const context = output.getContext("2d");
      if (!context) throw new Error("The browser could not prepare the render output canvas.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.filter = `contrast(${captureTuning.exportContrast}) saturate(${captureTuning.exportSaturation})`;
      context.drawImage(gl.domElement, 0, 0, request.widthPx, request.heightPx);
      context.filter = "none";
      const allowTransparent = getRenderPresetBehavior(quality).allowTransparentBackground
        && request.transparentBackground;
      if (!allowTransparent) {
        drawHeroVignette(context, request.widthPx, request.heightPx, captureTuning.vignetteStrength);
      }
      return output.toDataURL("image/png", 1);
    }

    return {
      async capturePng(request) {
        const posed = poseCamera(request);
        const restoreSize = beginSizedGlCapture(gl, scene, camera, size, posed.renderWidth, posed.renderHeight);
        try {
          return beautyPng(request, posed.captureTuning);
        } finally {
          posed.restorePose();
          restoreSize();
          invalidate();
        }
      },
      async captureStillBundle(request) {
        const posed = poseCamera(request);
        const restoreSize = beginSizedGlCapture(gl, scene, camera, size, posed.renderWidth, posed.renderHeight);
        try {
          const allowTransparent = getRenderPresetBehavior(quality).allowTransparentBackground
            && request.transparentBackground;
          if (allowTransparent) {
            scene.background = null;
            scene.fog = null;
            gl.setClearAlpha(0);
          }
          const heroPng = beautyPng(request, posed.captureTuning);
          const support = captureStillSupportMaps(gl, scene, camera, request.widthPx, request.heightPx);
          return { heroPng, ...support };
        } finally {
          posed.restorePose();
          restoreSize();
          invalidate();
        }
      },
    };
  }, [
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
