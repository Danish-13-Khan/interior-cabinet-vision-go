import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
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
import { modelViewUsesOrthographic } from "../../domain/livingRoom/modelViewPresets";
import {
  consumeOrbitEaseCancelGeneration,
  easeInOutCubic,
  lerpNumber,
  lerpPoint3,
  MODEL_VIEW_CAMERA_EASE_MS,
} from "../../domain/livingRoom/modelViewCameraEase";
import {
  cameraPoseFingerprint,
  modelViewFramingIntentKey,
  nextUserOwnedCameraPose,
  shouldApplyCameraFramingPose,
  shouldHoldFitFraming,
} from "../../domain/livingRoom/modelViewCameraFramingPolicy";
import { applyCameraPose, readCameraPoseMeters, stampFrameMetrics, type CameraPoseMeters } from "./cameraRigPose";
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
}) {
  const { camera, size, invalidate, gl } = useThree();
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const lastFitVersionRef = useRef(0);
  const lastOrthoRef = useRef(modelViewUsesOrthographic(viewPreset));
  const heldFitTargetRef = useRef<ModelViewHeldFit | null>(null);
  const fromRef = useRef<CameraPoseMeters | null>(null);
  const goalRef = useRef<CameraPoseMeters | null>(null);
  const animStartRef = useRef(0);
  const animatingRef = useRef(false);
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
    if (result.cancel) animatingRef.current = false;
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
      viewport: { widthPx: size.width, heightPx: size.height },
      useFitPose: holdFit,
    });
    applyCameraClipPlanes(camera, current);
    stampFrameMetrics(gl.domElement, current.bounds, built.goal, {
      widthPx: size.width, heightPx: size.height,
    }, viewPreset === "walkthrough");
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
      animatingRef.current = false;
      return;
    }
    if (orthoSwitched) {
      applyCameraPose(camera, controlsRef.current, built.goal);
      animatingRef.current = false;
      invalidate();
      return;
    }
    fromRef.current = readCameraPoseMeters(camera, controlsRef.current, built.orthographic);
    goalRef.current = built.goal;
    animStartRef.current = performance.now();
    animatingRef.current = true;
    invalidate();
  }, [
    activeCameraId, assetRevision, camera, composition, cameraHeightMm, controlsRef,
    fitMode, fitVersion, fieldOfViewDegrees, gl, invalidate, renderMode,
    projectCamera?.fieldOfViewDegrees, projectCamera?.id, projectCamera?.position.x,
    projectCamera?.position.y, projectCamera?.position.z, projectCamera?.target.x,
    projectCamera?.target.y, projectCamera?.target.z, scene.projectId, scene.roomId,
    scene.bounds.size.widthMm, scene.bounds.size.heightMm, scene.bounds.size.depthMm,
    size.height, size.width, viewPreset,
  ]);
  useFrame(() => {
    if (latchOrbitCancel() || userIsNavigating()) {
      animatingRef.current = false;
      return;
    }
    if (!animatingRef.current || !fromRef.current || !goalRef.current) return;
    const elapsed = performance.now() - animStartRef.current;
    const t = easeInOutCubic(elapsed / MODEL_VIEW_CAMERA_EASE_MS);
    const from = fromRef.current;
    const goal = goalRef.current;
    applyCameraPose(camera, controlsRef.current, {
      position: lerpPoint3(from.position, goal.position, t),
      target: lerpPoint3(from.target, goal.target, t),
      fieldOfViewDegrees: from.fieldOfViewDegrees !== undefined
        && goal.fieldOfViewDegrees !== undefined
        ? lerpNumber(from.fieldOfViewDegrees, goal.fieldOfViewDegrees, t)
        : goal.fieldOfViewDegrees,
      orthographicZoom: from.orthographicZoom !== undefined
        && goal.orthographicZoom !== undefined
        ? lerpNumber(from.orthographicZoom, goal.orthographicZoom, t)
        : goal.orthographicZoom,
      orthographic: goal.orthographic,
    });
    if (t >= 1) animatingRef.current = false;
    else invalidate();
  });

  return null;
}
