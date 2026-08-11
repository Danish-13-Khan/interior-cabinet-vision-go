import { forwardRef, useImperativeHandle } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector2 } from "three";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";

export type RenderCaptureRequest = {
  cameraId: string;
  widthPx: number;
  heightPx: number;
  transparentBackground: boolean;
};

export type RenderCaptureHandle = {
  capturePng: (request: RenderCaptureRequest) => Promise<string>;
};

export const RenderCaptureBridge = forwardRef<
  RenderCaptureHandle,
  { compiledScene: CompiledLivingRoomScene }
>(function RenderCaptureBridge({ compiledScene }, ref) {
  const { camera, gl, invalidate, scene, size } = useThree();

  useImperativeHandle(ref, () => ({
    async capturePng(request) {
      const preset = compiledScene.cameras.find(
        (candidate) => candidate.id === request.cameraId,
      );
      if (!preset) throw new Error("The selected render camera is unavailable.");
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
        gl.setSize(request.widthPx, request.heightPx, false);
        scene.updateMatrixWorld(true);
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png", 1);
      } finally {
        camera.position.copy(oldPosition);
        camera.quaternion.copy(oldQuaternion);
        camera.fov = oldFov;
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
  }), [camera, compiledScene.cameras, gl, invalidate, scene, size.height, size.width]);

  return null;
});
