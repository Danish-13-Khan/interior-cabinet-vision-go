import { useThree } from "@react-three/fiber";
import { useEffect, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import { resolveRenderCameraPose } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";

export function CameraRig({
  scene,
  activeCameraId,
  controlsRef,
  composition,
  renderMode = "preview",
}: {
  scene: CompiledLivingRoomScene;
  activeCameraId: string | null;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  composition: RenderComposition;
  renderMode?: RenderMode;
}) {
  const { camera } = useThree();
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];
  const preset = projectCamera
    ? resolveRenderCameraPose(projectCamera, scene.bounds, composition, renderMode)
    : null;

  useEffect(() => {
    if (preset) {
      camera.position.set(
        preset.position.x / 1000,
        preset.position.y / 1000,
        preset.position.z / 1000,
      );
      if ("fov" in camera) {
        camera.fov = preset.fieldOfViewDegrees;
        camera.updateProjectionMatrix();
      }
      controlsRef.current?.target.set(
        preset.target.x / 1000,
        preset.target.y / 1000,
        preset.target.z / 1000,
      );
    } else {
      const { center, size } = scene.bounds;
      const distance = Math.max(size.widthMm, size.depthMm, size.heightMm) / 1000 * 1.05;
      camera.position.set(
        center.x / 1000 + distance,
        center.y / 1000 + distance * 0.55,
        center.z / 1000 + distance,
      );
      controlsRef.current?.target.set(center.x / 1000, center.y / 1000, center.z / 1000);
    }
    controlsRef.current?.update();
  }, [
    activeCameraId,
    camera,
    composition,
    controlsRef,
    preset,
    renderMode,
    scene.bounds.center.x,
    scene.bounds.center.y,
    scene.bounds.center.z,
    scene.bounds.size.depthMm,
    scene.bounds.size.heightMm,
    scene.bounds.size.widthMm,
  ]);

  return null;
}
