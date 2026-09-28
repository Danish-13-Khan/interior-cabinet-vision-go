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
import { resolveCabinetRunFrame, type CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
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
  /** Frame the cabinet run: authoring on Dollhouse entry, client always (Present). */
  frameRun?: CabinetRunAudience;
}): { goal: CameraPoseMeters; orthographic: boolean } {
  const { scene } = args;
  const viewPreset = args.viewPreset ?? "perspective";
  const runFrame = cabinetRunFrameFor(args, viewPreset);
  if (runFrame) {
    return {
      orthographic: false,
      goal: {
        position: { x: mmToMeters(runFrame.position.x), y: mmToMeters(runFrame.position.y), z: mmToMeters(runFrame.position.z) },
        target: { x: mmToMeters(runFrame.target.x), y: mmToMeters(runFrame.target.y), z: mmToMeters(runFrame.target.z) },
        fieldOfViewDegrees: runFrame.fieldOfViewDegrees,
        orthographic: false,
      },
    };
  }
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
  const savedPerspective = viewPreset === "perspective" && named && !args.useFitPose
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
      orthographicZoom: !orthographic
        ? undefined
        : selectionFit
          ? orthographicZoomForSpan(selectionFit.spanMm, args.viewport, 1.15)
          : framed.orthographicZoom ?? orthographicZoomForSpan(spanMm, args.viewport, 1.15),
      orthographic,
    },
  };
}

function cabinetRunFrameFor(
  args: Parameters<typeof buildCameraRigGoal>[0],
  viewPreset: ModelViewPresetId,
) {
  if (!args.frameRun) return null;
  const runFit = args.useFitPose && args.fitMode === "run";
  if (args.useFitPose && !runFit) return null;
  if (args.frameRun === "author" && viewPreset !== "dollhouse" && !runFit) return null;
  return resolveCabinetRunFrame(args.scene, args.viewport, {
    audience: args.frameRun,
    fieldOfViewDegrees: args.fieldOfViewDegrees,
  });
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
