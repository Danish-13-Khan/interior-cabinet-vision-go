import type { InteriorProject } from "../interiorProject";
import { createLivingRoomCameras } from "./cameras";
import { defaultLivingRoomIdFactory } from "./ids";
import {
  createLivingRoomLights,
  type LivingRoomLightingRecipeId,
} from "./lighting";
import { createDefaultPackageCameraBookmarks } from "./packageCameraBookmarks";

const RECIPES: readonly LivingRoomLightingRecipeId[] = [
  "daylight",
  "warm-evening",
  "neutral-studio",
];

function recipeId(project: InteriorProject): LivingRoomLightingRecipeId {
  const candidate = project.renderSettings.lightingRecipeId;
  return RECIPES.includes(candidate as LivingRoomLightingRecipeId)
    ? candidate as LivingRoomLightingRecipeId
    : "neutral-studio";
}

/** Attach review cameras and lights the first time a blank plan gets a room. */
export function ensureDrawnRoomReviewRig(
  before: InteriorProject,
  after: InteriorProject,
): InteriorProject {
  if (before.rooms.length > 0 || after.rooms.length === 0) return after;
  const roomId = after.activeRoomId;
  if (!roomId) return after;
  const cameras = createLivingRoomCameras(roomId, defaultLivingRoomIdFactory);
  const lights = createLivingRoomLights(roomId, recipeId(after), defaultLivingRoomIdFactory);
  const activeCameraId = cameras.find((camera) => camera.isDefault)?.id ?? cameras[0]?.id ?? null;
  return {
    ...after,
    cameras,
    lights,
    renderSettings: {
      ...after.renderSettings,
      activeCameraId,
      packageCameraBookmarks: createDefaultPackageCameraBookmarks(cameras),
    },
  };
}
