import type { InteriorProject } from "../../../domain/interiorProject";
import {
  buildCyclesStillBundle,
  compileLivingRoomScene,
  type CyclesModelAssetLookup,
  type CyclesStillBundle,
} from "../../../domain/livingRoom";
import { lightingRecipeForMood, readLightingMood, type LightingMood } from "../../../domain/livingRoom/lightingMood";
import { getEnvironmentForLightingRecipe } from "../../assets/assetRegistry";
import { MODEL_ASSET_MANIFEST } from "../../assets/modelManifest";

/** Catalog GLBs the runner can resolve from `public/`. Unavailable models fall back to primitives. */
export function cyclesModelAssetLookup(): CyclesModelAssetLookup {
  const lookup: CyclesModelAssetLookup = {};
  for (const asset of MODEL_ASSET_MANIFEST) {
    if (!asset.available) continue;
    lookup[asset.id] = { assetKey: asset.assetKey, nativeSizeMm: asset.nativeSizeMm };
  }
  return lookup;
}

export type ExportCyclesBundleOptions = {
  cameraId?: string;
  widthPx?: number;
  heightPx?: number;
  /** Defaults to the project's saved mood, the same way Model View reads it. */
  mood?: LightingMood;
  jobId?: string;
  seed?: number;
  createdAt?: string;
  timeCapSeconds?: number;
  samplesMax?: number;
};

function defaultCameraId(project: InteriorProject): string {
  const roomCameras = project.cameras.filter((camera) => camera.roomId === project.activeRoomId);
  const saved = roomCameras.find((camera) => camera.id === project.renderSettings.activeCameraId);
  const chosen = saved ?? roomCameras.find((camera) => camera.isDefault) ?? roomCameras[0];
  if (!chosen) throw new Error("The active room has no camera to render from.");
  return chosen.id;
}

/**
 * Compile the authored project for the active room and describe it for Cycles.
 * The mood swaps the lighting recipe exactly as the showcase tour does, so the
 * still is lit by the same recipe and HDRI the viewport showed.
 */
export function exportCyclesBundleForProject(
  project: InteriorProject,
  options: ExportCyclesBundleOptions = {},
): CyclesStillBundle {
  const mood = options.mood ?? readLightingMood(project);
  const compiled = compileLivingRoomScene(project);
  const lightingRecipeId = lightingRecipeForMood(compiled.lightingRecipeId, mood);
  const scene = lightingRecipeId === compiled.lightingRecipeId ? compiled : { ...compiled, lightingRecipeId };
  const environmentAsset = getEnvironmentForLightingRecipe(scene.lightingRecipeId);
  const cameraId = options.cameraId ?? defaultCameraId(project);
  const jobId = options.jobId ?? `cy-${cameraId.slice(-8)}-${Date.now().toString(36)}`;
  return buildCyclesStillBundle({
    project,
    scene,
    cameraId,
    jobId,
    createdAt: options.createdAt,
    widthPx: options.widthPx ?? project.renderSettings.widthPx,
    heightPx: options.heightPx ?? project.renderSettings.heightPx,
    seed: options.seed,
    samplesMax: options.samplesMax,
    timeCapSeconds: options.timeCapSeconds,
    mood,
    environment: environmentAsset?.available
      ? { assetKey: environmentAsset.assetKey, intensity: environmentAsset.intensity }
      : null,
    modelAssets: cyclesModelAssetLookup(),
  });
}
