import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { RenderComposition } from "../../domain/interiorProject";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import { resolveModelViewFitPose } from "../../domain/livingRoom/modelViewFit";
import { resolveExteriorFrame } from "../../domain/livingRoom/modelViewExteriorFrame";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { modelViewUsesOrthographic } from "../../domain/livingRoom/modelViewPresets";
import { resolveModelViewCameraFarMeters } from "../../domain/livingRoom/modelViewCameraEase";
import { orthographicZoomForSpan } from "../../domain/livingRoom/modelViewPresets";
import { resolveRenderCameraPose } from "../../domain/livingRoom/renderCameraPose";
import { mmToMeters, type CameraPoseMeters } from "./cameraRigPose";

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
  const orthographic = modelViewUsesOrthographic(viewPreset);
  const framed = resolveExteriorFrame(
    scene.bounds,
    viewPreset,
    args.viewport,
    args.fieldOfViewDegrees,
  );
  const selectionFit = args.useFitPose && args.fitMode === "selection"
    ? resolveModelViewFitPose(scene, viewPreset, args.fitMode, args.fitSelection, {
      widthPx: args.viewport.widthPx,
      heightPx: args.viewport.heightPx,
      fieldOfViewDegrees: args.fieldOfViewDegrees,
    })
    : null;
  const named = scene.cameras.find((camera) => camera.id === args.activeCameraId) ?? null;
  const savedPerspective = viewPreset === "perspective" && named && !selectionFit
    ? resolveRenderCameraPose(named, scene.bounds, args.composition, args.renderMode)
    : null;
  const framing = selectionFit ?? savedPerspective ?? framed;
  const heightDelta = viewPreset === "dollhouse" && typeof args.cameraHeightMm === "number"
    ? args.cameraHeightMm - 3300
    : 0;
  const overriddenPosition = { ...framing.position, y: framing.position.y + heightDelta };
  const spanMm = "spanMm" in framing && typeof framing.spanMm === "number"
    ? framing.spanMm
    : Math.max(scene.bounds.size.widthMm, scene.bounds.size.depthMm, scene.bounds.size.heightMm, 2400);
  const savedFov = savedPerspective?.fieldOfViewDegrees;
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
      fieldOfViewDegrees: savedFov
        ?? args.fieldOfViewDegrees
        ?? ("fieldOfViewDegrees" in framing ? framing.fieldOfViewDegrees : undefined),
      orthographicZoom: orthographic
        ? framed.orthographicZoom ?? orthographicZoomForSpan(spanMm, args.viewport, 1.15)
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
