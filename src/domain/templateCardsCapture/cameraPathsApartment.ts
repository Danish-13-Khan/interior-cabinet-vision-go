import type { InteriorProject } from "../interiorProject";
import { compileApartmentScene } from "../livingRoom/apartmentScene";
import { aabbFitDistanceMm, offsetFromTargetMm } from "../livingRoom/modelViewFitDistance";
import type { RoomSceneLookup } from "../livingRoom/roomSceneCache";
import { resolveRenderCameraPose } from "../livingRoom/renderCameraPose";
import { showcaseTourStops } from "../apartmentTemplates/showcaseTour";
import { showcaseCameraForRoom } from "../apartmentTemplates/showcaseCamera";
import { easeInOutCubic } from "../livingRoom/modelViewCameraEase";
import { apartmentSlugFromId } from "../templateCardMedia/templateIds";
import { applyHeroCompositionOverride, planCornerFor } from "./heroCompositionOverrides";
import { blendCameraPoses, cameraEntityToPose, type CardCameraPose } from "./cameraPathPose";

export const CARD_VIEWPORT = { widthPx: 800, heightPx: 600 };

function heroStop(project: InteriorProject) {
  const stops = showcaseTourStops(project);
  return stops.find((stop) => !stop.overview && stop.roomId) ?? stops.at(-1)!;
}

function apartmentSlug(project: InteriorProject): string {
  return apartmentSlugFromId(String(project.extensions?.apartmentTemplateId ?? ""));
}

/**
 * Plan still: the overview's north-east corner, but steeper than the app's
 * (y 0.85), so the card shows floors and rooms rather than outside wall faces,
 * and fitted to the 4:3 card instead of a 16:9 viewport.
 */
const PLAN_ELEVATION_Y = 1.45;
const PLAN_FOV_DEG = 42;
const PLAN_PADDING = 1.04;

function overviewPose(project: InteriorProject, sceneFor: RoomSceneLookup): CardCameraPose {
  const { bounds } = compileApartmentScene(project, sceneFor);
  const corner = planCornerFor(apartmentSlug(project));
  const direction = {
    x: corner === "nw" || corner === "sw" ? -1 : 1,
    y: PLAN_ELEVATION_Y,
    z: corner === "se" || corner === "sw" ? -1 : 1,
  };
  const target = { x: bounds.center.x, y: bounds.center.y, z: bounds.center.z };
  const distance = aabbFitDistanceMm({
    min: bounds.min,
    max: bounds.max,
    viewFromTarget: direction,
    fovDegrees: PLAN_FOV_DEG,
    aspect: CARD_VIEWPORT.widthPx / CARD_VIEWPORT.heightPx,
    padding: PLAN_PADDING,
  });
  return cameraEntityToPose({
    id: "card-capture-plan",
    roomId: project.rooms[0]?.id ?? "",
    name: "Card plan",
    position: offsetFromTargetMm(target, direction, distance),
    target,
    fieldOfViewDegrees: PLAN_FOV_DEG,
    isDefault: false,
  });
}

function heroPose(project: InteriorProject, sceneFor: RoomSceneLookup): CardCameraPose {
  const stop = heroStop(project);
  const roomScene = sceneFor(stop.roomId!);
  let camera = roomScene.cameras.find((item) => item.id === stop.cameraId)
    ?? showcaseCameraForRoom(project, stop.roomId!)!;
  camera = applyHeroCompositionOverride(camera, apartmentSlug(project));
  // Match showcase tour framing: authored wide corner cameras, not export hero eye-level.
  const resolved = resolveRenderCameraPose(camera, roomScene.bounds, "project-camera", "preview");
  return cameraEntityToPose(resolved);
}

export function apartmentPathPose(
  project: InteriorProject,
  sceneFor: RoomSceneLookup,
  path: "hero" | "overview" | "overview-to-hero",
  t: number,
): { pose: CardCameraPose; overview: boolean; roomId: string | null; cameraId: string | null } {
  if (path === "overview") {
    return { pose: overviewPose(project, sceneFor), overview: true, roomId: null, cameraId: null };
  }
  if (path === "hero") {
    const stop = heroStop(project);
    return { pose: heroPose(project, sceneFor), overview: false, roomId: stop.roomId, cameraId: stop.cameraId };
  }
  const eased = easeInOutCubic(t);
  return {
    pose: blendCameraPoses(overviewPose(project, sceneFor), heroPose(project, sceneFor), eased),
    overview: t < 0.5,
    roomId: t >= 0.5 ? heroStop(project).roomId : null,
    cameraId: t >= 0.5 ? heroStop(project).cameraId : null,
  };
}
