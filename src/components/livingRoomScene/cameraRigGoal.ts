import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { RenderComposition } from "../../domain/interiorProject";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import { resolveModelViewFitPose } from "../../domain/livingRoom/modelViewFit";
import {
  orthographicZoomForSpan,
  resolveModelViewPose,
  resolveRenderCameraPose,
} from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { modelViewUsesOrthographic } from "../../domain/livingRoom/modelViewPresets";
import { resolveModelViewCameraFarMeters } from "../../domain/livingRoom/modelViewCameraEase";
import {
  fallbackFraming,
  mmToMeters,
  type CameraPoseMeters,
} from "./cameraRigPose";

export function buildCameraRigGoal(args: {
  scene: CompiledLivingRoomScene;
  activeCameraId: string | null;
  composition: RenderComposition;
  renderMode: RenderMode;
  viewPreset: ModelViewPresetId | undefined;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  fitMode: ModelViewFitMode;
  fitSelection: ModelViewFitSelection;
  viewport: { widthPx: number; heightPx: number };
  useFitPose: boolean;
}): { goal: CameraPoseMeters; orthographic: boolean } {
  const { scene } = args;
  const viewPreset = args.viewPreset ?? "perspective";
  const named = scene.cameras.find((candidate) => candidate.id === args.activeCameraId)
    ?? scene.cameras.find((candidate) => candidate.isDefault)
    ?? scene.cameras[0];
  const orthographic = modelViewUsesOrthographic(viewPreset);
  const namedPose = named
    ? resolveRenderCameraPose(named, scene.bounds, args.composition, args.renderMode)
    : null;
  const framingPose = args.useFitPose
    ? resolveModelViewFitPose(scene, viewPreset, args.fitMode, args.fitSelection)
    : viewPreset === "perspective"
      ? namedPose
      : resolveModelViewPose(scene, viewPreset === "walkthrough" ? "dollhouse" : viewPreset);
  const framing = framingPose ?? fallbackFraming(scene);
  const overriddenPosition = typeof args.cameraHeightMm === "number"
    ? { ...framing.position, y: args.cameraHeightMm }
    : framing.position;
  const spanMm = "spanMm" in framing && typeof framing.spanMm === "number"
    ? framing.spanMm
    : Math.max(
      scene.bounds.size.widthMm,
      scene.bounds.size.depthMm,
      scene.bounds.size.heightMm,
      2400,
    );
  return {
    orthographic,
    goal: {
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
      fieldOfViewDegrees: args.fieldOfViewDegrees
        ?? ("fieldOfViewDegrees" in framing ? framing.fieldOfViewDegrees : undefined),
      orthographicZoom: orthographic
        ? orthographicZoomForSpan(spanMm, args.viewport)
        : undefined,
      orthographic,
    },
  };
}

export function applyCameraClipPlanes(
  camera: { far: number; near: number; updateProjectionMatrix: () => void },
  scene: CompiledLivingRoomScene,
) {
  const roomSpanM = Math.max(scene.bounds.size.widthMm, scene.bounds.size.depthMm) / 1000;
  camera.far = resolveModelViewCameraFarMeters(roomSpanM);
  camera.near = 0.05;
  camera.updateProjectionMatrix();
}
