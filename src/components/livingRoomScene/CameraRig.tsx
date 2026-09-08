import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Camera, OrthographicCamera, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import {
  resolveModelViewFitPose,
  type ModelViewFitMode,
  type ModelViewFitSelection,
} from "../../domain/livingRoom/modelViewFit";
import {
  orthographicZoomForSpan,
  resolveModelViewPose,
  resolveRenderCameraPose,
} from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { modelViewUsesOrthographic } from "../../domain/livingRoom/modelViewPresets";

function toMeters(valueMm: number) {
  return valueMm / 1000;
}

function applyCameraPose(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  positionMm: { x: number; y: number; z: number },
  targetMm: { x: number; y: number; z: number },
  opts: { fieldOfViewDegrees?: number; orthographicZoom?: number; orthographic: boolean },
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
  if (opts.orthographic) {
    const ortho = camera as OrthographicCamera;
    if (typeof opts.orthographicZoom === "number") ortho.zoom = opts.orthographicZoom;
    ortho.updateProjectionMatrix();
  } else if (typeof opts.fieldOfViewDegrees === "number") {
    const perspective = camera as PerspectiveCamera;
    perspective.fov = opts.fieldOfViewDegrees;
    perspective.updateProjectionMatrix();
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
    spanMm: Math.max(size.widthMm, size.depthMm, size.heightMm),
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
  fitVersion = 0,
  fitMode = "room",
  fitSelection,
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
  fitVersion?: number;
  fitMode?: ModelViewFitMode;
  fitSelection?: ModelViewFitSelection;
}) {
  const { camera, size } = useThree();
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const lastFitVersionRef = useRef(0);
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];
  const selection = fitSelection ?? { objectIds: [], wallId: null, openingId: null };

  useLayoutEffect(() => {
    const current = sceneRef.current;
    const named = current.cameras.find((candidate) => candidate.id === activeCameraId)
      ?? current.cameras.find((candidate) => candidate.isDefault)
      ?? current.cameras[0];
    const orthographic = modelViewUsesOrthographic(viewPreset);
    const namedPose = named
      ? resolveRenderCameraPose(named, current.bounds, composition, renderMode)
      : null;
    // Fit/Focus is one-shot: only apply when fitVersion advances, then restore normal preset framing.
    const applyFitShot = fitVersion > lastFitVersionRef.current;
    if (applyFitShot) lastFitVersionRef.current = fitVersion;

    const framingPose = applyFitShot
      ? resolveModelViewFitPose(current, viewPreset, fitMode, selection)
      : viewPreset === "perspective"
        ? namedPose
        : resolveModelViewPose(current, viewPreset === "walkthrough" ? "dollhouse" : viewPreset);
    const framing = framingPose ?? fallbackFraming(current);
    const overriddenPosition = typeof cameraHeightMm === "number"
      ? { ...framing.position, y: cameraHeightMm }
      : framing.position;
    const spanMm = "spanMm" in framing && typeof framing.spanMm === "number"
      ? framing.spanMm
      : Math.max(
        current.bounds.size.widthMm,
        current.bounds.size.depthMm,
        current.bounds.size.heightMm,
        2400,
      );
    const orthographicZoom = orthographic
      ? orthographicZoomForSpan(spanMm, { widthPx: size.width, heightPx: size.height })
      : undefined;
    const apply = () => {
      applyCameraPose(
        camera,
        controlsRef.current,
        overriddenPosition,
        framing.target,
        {
          fieldOfViewDegrees: fieldOfViewDegrees
            ?? ("fieldOfViewDegrees" in framing ? framing.fieldOfViewDegrees : undefined),
          orthographicZoom,
          orthographic,
        },
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
    fitMode,
    fitVersion,
    fieldOfViewDegrees,
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
    selection.objectIds.join(","),
    selection.openingId,
    selection.wallId,
    size.height,
    size.width,
    viewPreset,
  ]);

  return null;
}
