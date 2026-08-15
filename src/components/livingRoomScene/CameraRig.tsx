import { useThree } from "@react-three/fiber";
import { useLayoutEffect, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraEntity, RenderComposition } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import { resolveRenderCameraPose } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";

function toMeters(valueMm: number) {
  return valueMm / 1000;
}

function applyCameraPose(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl | null,
  positionMm: { x: number; y: number; z: number },
  targetMm: { x: number; y: number; z: number },
  fieldOfViewDegrees?: number,
) {
  const position = {
    x: toMeters(positionMm.x),
    y: toMeters(positionMm.y),
    z: toMeters(positionMm.z),
  };
  const target = {
    x: toMeters(targetMm.x),
    y: toMeters(targetMm.y),
    z: toMeters(targetMm.z),
  };
  camera.position.set(position.x, position.y, position.z);
  if (typeof fieldOfViewDegrees === "number") {
    camera.fov = fieldOfViewDegrees;
    camera.updateProjectionMatrix();
  }
  camera.lookAt(target.x, target.y, target.z);
  camera.updateMatrixWorld();
  if (controls) {
    controls.target.set(target.x, target.y, target.z);
    controls.update();
  }
}

function fallbackFraming(scene: CompiledLivingRoomScene) {
  const { center, size } = scene.bounds;
  const distance = Math.max(size.widthMm, size.depthMm, size.heightMm) * 1.05;
  return {
    position: {
      x: center.x + distance,
      y: center.y + distance * 0.55,
      z: center.z + distance,
    },
    target: center,
    fieldOfViewDegrees: undefined as number | undefined,
  };
}

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
  const pose: Pick<CameraEntity, "position" | "target" | "fieldOfViewDegrees"> | null = projectCamera
    ? resolveRenderCameraPose(projectCamera, scene.bounds, composition, renderMode)
    : null;
  const framing = pose ?? fallbackFraming(scene);

  useLayoutEffect(() => {
    const apply = () => {
      applyCameraPose(
        camera as PerspectiveCamera,
        controlsRef.current,
        framing.position,
        framing.target,
        framing.fieldOfViewDegrees,
      );
    };
    apply();
    const frame = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(frame);
  }, [
    activeCameraId,
    camera,
    composition,
    controlsRef,
    framing.fieldOfViewDegrees,
    framing.position.x,
    framing.position.y,
    framing.position.z,
    framing.target.x,
    framing.target.y,
    framing.target.z,
    renderMode,
  ]);

  return null;
}
