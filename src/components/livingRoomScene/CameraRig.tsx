import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
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
import {
  easeInOutCubic,
  lerpNumber,
  lerpPoint3,
  MODEL_VIEW_CAMERA_EASE_MS,
  resolveModelViewCameraFarMeters,
} from "../../domain/livingRoom/modelViewCameraEase";
import {
  applyCameraPose,
  fallbackFraming,
  mmToMeters,
  readCameraPoseMeters,
  type CameraPoseMeters,
} from "./cameraRigPose";

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
}) {
  const { camera, size } = useThree();
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const lastFitVersionRef = useRef(0);
  const lastOrthoRef = useRef(modelViewUsesOrthographic(viewPreset));
  const selectionRef = useRef(fitSelection ?? { objectIds: [], wallId: null, openingId: null });
  selectionRef.current = fitSelection ?? { objectIds: [], wallId: null, openingId: null };
  const fromRef = useRef<CameraPoseMeters | null>(null);
  const goalRef = useRef<CameraPoseMeters | null>(null);
  const animStartRef = useRef(0);
  const animatingRef = useRef(false);
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const projectCamera = scene.cameras.find((candidate) => candidate.id === activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];

  useLayoutEffect(() => {
    const current = sceneRef.current;
    const named = current.cameras.find((candidate) => candidate.id === activeCameraId)
      ?? current.cameras.find((candidate) => candidate.isDefault)
      ?? current.cameras[0];
    const orthographic = modelViewUsesOrthographic(viewPreset);
    const namedPose = named
      ? resolveRenderCameraPose(named, current.bounds, composition, renderMode)
      : null;
    const applyFitShot = fitVersion > lastFitVersionRef.current;
    if (applyFitShot) lastFitVersionRef.current = fitVersion;

    const framingPose = applyFitShot
      ? resolveModelViewFitPose(current, viewPreset, fitMode, selectionRef.current)
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
    const roomSpanM = Math.max(current.bounds.size.widthMm, current.bounds.size.depthMm) / 1000;
    camera.far = resolveModelViewCameraFarMeters(roomSpanM);
    camera.near = 0.05;
    camera.updateProjectionMatrix();

    const goal: CameraPoseMeters = {
      position: {
        x: mmToMeters(overriddenPosition.x),
        y: mmToMeters(overriddenPosition.y),
        z: mmToMeters(overriddenPosition.z),
      },
      target: {
        x: mmToMeters(framing.target.x),
        y: mmToMeters(framing.target.y),
        z: mmToMeters(framing.target.z),
      },
      fieldOfViewDegrees: fieldOfViewDegrees
        ?? ("fieldOfViewDegrees" in framing ? framing.fieldOfViewDegrees : undefined),
      orthographicZoom: orthographic
        ? orthographicZoomForSpan(spanMm, { widthPx: size.width, heightPx: size.height })
        : undefined,
      orthographic,
    };

    const orthoSwitched = lastOrthoRef.current !== orthographic;
    lastOrthoRef.current = orthographic;
    if (orthoSwitched || draggingRef.current) {
      applyCameraPose(camera, controlsRef.current, goal);
      animatingRef.current = false;
      return;
    }

    fromRef.current = readCameraPoseMeters(camera, controlsRef.current, orthographic);
    goalRef.current = goal;
    animStartRef.current = performance.now();
    animatingRef.current = true;
  }, [
    activeCameraId, assetRevision, camera, composition, cameraHeightMm, controlsRef,
    fitMode, fitVersion, fieldOfViewDegrees, projectCamera?.fieldOfViewDegrees,
    projectCamera?.id, projectCamera?.position.x, projectCamera?.position.y,
    projectCamera?.position.z, projectCamera?.target.x, projectCamera?.target.y,
    projectCamera?.target.z, renderMode, scene.projectId, scene.roomId,
    size.height, size.width, viewPreset,
  ]);

  useFrame(() => {
    if (draggingRef.current) {
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
  });

  return null;
}
