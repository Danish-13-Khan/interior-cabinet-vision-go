import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RenderComposition } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import {
  resolveHeldFitSnapshot,
  type ModelViewFitMode,
  type ModelViewFitSelection,
  type ModelViewHeldFit,
} from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import { modelViewUsesOrthographic } from "../../domain/livingRoom/modelViewPresets";
import { consumeOrbitEaseCancelGeneration } from "../../domain/livingRoom/modelViewCameraEase";
import { takeShowcaseGlideMs } from "../../domain/apartmentTemplates/showcaseJump";
import {
  cameraPoseFingerprint,
  modelViewFramingIntentKey,
  nextUserOwnedCameraPose,
  shouldApplyCameraFramingPose,
  shouldHoldFitFraming,
} from "../../domain/livingRoom/modelViewCameraFramingPolicy";
import { applyCameraPose, markCameraFrameUnsettled, publishLiveCameraFrame, readCameraPoseMeters } from "./cameraRigPose";
import { createCameraGlide } from "./cameraRigGlide";
import { applyCameraClipPlanes, buildCameraRigGoal } from "./cameraRigGoal";

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
  dragging = false,
  orbitNavigatingRef,
  orbitEaseCancelGenerationRef,
  frameRun,
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
  dragging?: boolean;
  orbitNavigatingRef?: RefObject<boolean>;
  orbitEaseCancelGenerationRef?: RefObject<number>;
  frameRun?: CabinetRunAudience;
}) {
  const { camera, size, invalidate, gl } = useThree();
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const lastFitVersionRef = useRef(0);
  const lastOrthoRef = useRef(modelViewUsesOrthographic(viewPreset));
  const heldFitTargetRef = useRef<ModelViewHeldFit | null>(null);
  const [glide] = useState(createCameraGlide);
  const lastOrbitCancelGenerationRef = useRef(0);
  const lastIntentKeyRef = useRef("");
  const userOwnedPoseRef = useRef(false);
  const holdFitRef = useRef(false);
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];

  function userIsNavigating() {
    return draggingRef.current || Boolean(orbitNavigatingRef?.current);
  }
  function latchOrbitCancel() {
    const result = consumeOrbitEaseCancelGeneration(
      orbitEaseCancelGenerationRef?.current ?? 0,
      lastOrbitCancelGenerationRef.current,
    );
    lastOrbitCancelGenerationRef.current = result.nextSeenGeneration;
    userOwnedPoseRef.current = nextUserOwnedCameraPose({
      intentChanged: false,
      userNavigating: userIsNavigating(),
      orbitCancelled: result.cancel,
      wasOwned: userOwnedPoseRef.current,
    });
    if (result.cancel) glide.cancel();
    return result.cancel;
  }

  useLayoutEffect(() => {
    const current = sceneRef.current;
    const applyFitShot = fitVersion > lastFitVersionRef.current;
    if (applyFitShot) lastFitVersionRef.current = fitVersion;
    const intentKey = modelViewFramingIntentKey({
      activeCameraId, viewPreset, fitVersion, fitMode, cameraHeightMm, fieldOfViewDegrees,
      composition, renderMode, projectId: current.projectId, roomId: current.roomId,
      cameraFingerprint: cameraPoseFingerprint(projectCamera),
    });
    const intentChanged = intentKey !== lastIntentKeyRef.current;
    lastIntentKeyRef.current = intentKey;
    const holdFit = shouldHoldFitFraming({
      applyFitShot, intentChanged, wasHoldingFit: holdFitRef.current,
    });
    holdFitRef.current = holdFit;
    const heldFit = resolveHeldFitSnapshot({
      applyFitShot,
      liveMode: fitMode,
      liveSelection: fitSelection,
      held: heldFitTargetRef.current,
    });
    if (applyFitShot) heldFitTargetRef.current = heldFit;
    const viewport = { widthPx: size.width, heightPx: size.height };
    const built = buildCameraRigGoal({
      scene: current,
      activeCameraId,
      composition,
      renderMode,
      viewPreset,
      cameraHeightMm,
      fieldOfViewDegrees,
      fitMode: heldFit.mode,
      fitSelection: heldFit.selection,
      viewport,
      useFitPose: holdFit,
      frameRun,
    });
    applyCameraClipPlanes(camera, current);
    const publishSettled = () => publishLiveCameraFrame(
      gl.domElement, current.bounds, camera, controlsRef.current, built.orthographic, viewport, viewPreset === "walkthrough",
    );
    markCameraFrameUnsettled(gl.domElement);
    const orthoSwitched = lastOrthoRef.current !== built.orthographic;
    lastOrthoRef.current = built.orthographic;
    userOwnedPoseRef.current = nextUserOwnedCameraPose({
      intentChanged,
      userNavigating: userIsNavigating(),
      orbitCancelled: false,
      wasOwned: userOwnedPoseRef.current,
    });
    if (!shouldApplyCameraFramingPose({
      orthoSwitched, intentChanged,
      userOwnedPose: userOwnedPoseRef.current, userNavigating: userIsNavigating(),
    })) {
      glide.cancel();
      publishSettled();
      return;
    }
    if (orthoSwitched) {
      applyCameraPose(camera, controlsRef.current, built.goal);
      glide.cancel();
      publishSettled();
      invalidate();
      return;
    }
    const from = readCameraPoseMeters(camera, controlsRef.current, built.orthographic);
    glide.start(from, built.goal, performance.now(), takeShowcaseGlideMs() ?? undefined);
    invalidate();
  }, [
    activeCameraId, assetRevision, camera, composition, cameraHeightMm, controlsRef,
    fitMode, fitVersion, fieldOfViewDegrees, gl, glide, invalidate, renderMode,
    projectCamera?.fieldOfViewDegrees, projectCamera?.id, projectCamera?.position.x,
    projectCamera?.position.y, projectCamera?.position.z, projectCamera?.target.x,
    projectCamera?.target.y, projectCamera?.target.z, scene.projectId, scene.roomId,
    scene.bounds.size.widthMm, scene.bounds.size.heightMm, scene.bounds.size.depthMm,
    size.height, size.width, viewPreset, frameRun,
  ]);
  useFrame(() => {
    if (latchOrbitCancel() || userIsNavigating()) {
      glide.cancel();
      return;
    }
    const step = glide.step(performance.now());
    if (!step) return;
    applyCameraPose(camera, controlsRef.current, step.pose);
    if (!step.settled) invalidate();
    else {
      publishLiveCameraFrame(
        gl.domElement, sceneRef.current.bounds, camera, controlsRef.current, step.pose.orthographic,
        { widthPx: size.width, heightPx: size.height }, viewPreset === "walkthrough",
      );
    }
  });

  return null;
}
