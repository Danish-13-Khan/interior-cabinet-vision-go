import type { CameraEntity, InteriorProject } from "../../interiorProject";
import { stillJobProjectContentHash } from "./projectHash";
import {
  STILL_JOB_CONTRACT_NOTE,
  STILL_JOB_SCHEMA_VERSION,
  type StillJob,
  type StillJobAllowedEnhancement,
  type StillJobAttachmentRefs,
  type StillJobEngine,
  type StillJobMode,
} from "./types";

export type BuildStillJobInput = {
  project: InteriorProject;
  cameraId: string;
  jobId: string;
  createdAt?: string;
  seed?: number;
  engine?: StillJobEngine;
  allowedEnhancements?: StillJobAllowedEnhancement[];
  mode?: StillJobMode;
  styleIds?: string[];
  attachments?: StillJobAttachmentRefs;
};

const DEFAULT_ENGINE: StillJobEngine = {
  id: "stilljob-spike",
  version: "0.1.0",
};

const DEFAULT_ENHANCEMENTS: StillJobAllowedEnhancement[] = [
  "soft_shadows",
  "material_micro_detail",
  "exposure_grade",
];

function requireCamera(project: InteriorProject, cameraId: string): CameraEntity {
  const camera = project.cameras.find((item) => item.id === cameraId);
  if (!camera) {
    throw new Error(`StillJob camera not found: ${cameraId}`);
  }
  return camera;
}

/** Build a StillJob request from authored project + locked camera. No AI / no PNG bytes. */
export function buildStillJob(input: BuildStillJobInput): StillJob {
  const camera = requireCamera(input.project, input.cameraId);
  return {
    schemaVersion: STILL_JOB_SCHEMA_VERSION,
    jobId: input.jobId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    projectId: input.project.id,
    projectContentHash: stillJobProjectContentHash(input.project),
    cameraId: camera.id,
    cameraPose: {
      eye: { ...camera.position },
      target: { ...camera.target },
      fovDeg: camera.fieldOfViewDegrees,
    },
    qualityPresetId: input.project.renderSettings.quality,
    lightingRecipeId: input.project.renderSettings.lightingRecipeId,
    styleIds: input.styleIds ?? [],
    seed: input.seed ?? 0,
    engine: input.engine ?? DEFAULT_ENGINE,
    allowedEnhancements: input.allowedEnhancements ?? DEFAULT_ENHANCEMENTS,
    mode: input.mode ?? "faithful_enhance",
    forbiddenChangesNote: STILL_JOB_CONTRACT_NOTE,
    materials: input.project.materials.map((material) => ({
      materialId: material.id,
      name: material.name,
      type: material.kind,
    })),
    objects: input.project.objects.map((object) => ({
      id: object.id,
      catalogItemId: object.catalogItemId,
      category: object.category,
      position: { ...object.position },
      rotationYDeg: object.rotation.y,
      size: {
        w: object.dimensions.widthMm,
        d: object.dimensions.depthMm,
        h: object.dimensions.heightMm,
      },
    })),
    attachments: input.attachments ?? {},
  };
}
