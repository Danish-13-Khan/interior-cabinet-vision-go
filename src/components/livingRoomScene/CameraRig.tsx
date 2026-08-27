import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import { resolveModelViewPose, resolveRenderCameraPose } from "../../domain/livingRoom";
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
  viewPreset = "perspective",
  cameraHeightMm,
  fieldOfViewDegrees,
  assetRevision = 0,
}: {
  scene: CompiledLivingRoomScene;
  activeCameraId: string | null;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  composition: RenderComposition;
  renderMode?: RenderMode;
  viewPreset?: ModelViewPresetId;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  assetRevision?: number;
}) {
  const { camera } = useThree();
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];

  useLayoutEffect(() => {
    const current = sceneRef.current;
    const named = current.cameras.find((candidate) => candidate.id === activeCameraId)
      ?? current.cameras.find((candidate) => candidate.isDefault)
      ?? current.cameras[0];
    const pose = viewPreset === "perspective"
      ? (named ? resolveRenderCameraPose(named, current.bounds, composition, renderMode) : null)
      : resolveModelViewPose(current, viewPreset === "walkthrough" ? "dollhouse" : viewPreset);
    const framing = pose ?? fallbackFraming(current);
    const overriddenPosition = typeof cameraHeightMm === "number"
      ? { ...framing.position, y: cameraHeightMm }
      : framing.position;
    const apply = () => {
      applyCameraPose(
        camera as PerspectiveCamera,
        controlsRef.current,
        overriddenPosition,
        framing.target,
        fieldOfViewDegrees ?? framing.fieldOfViewDegrees,
      );
    };
    apply();
    const frame = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(frame);
  }, [
    activeCameraId,
    assetRevision,
    camera,
    composition,
    cameraHeightMm,
    controlsRef,
    projectCamera?.fieldOfViewDegrees,
    projectCamera?.id,
    projectCamera?.position.x,
    projectCamera?.position.y,
    projectCamera?.position.z,
    projectCamera?.target.x,
    projectCamera?.target.y,
    projectCamera?.target.z,
    renderMode,
    scene.fingerprint,
    viewPreset,
    fieldOfViewDegrees,
  ]);

  return null;
}
