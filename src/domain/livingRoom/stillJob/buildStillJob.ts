import type { CameraEntity, InteriorProject } from "../../interiorProject";
import { HERO_STILL_ENGINE, HERO_STILL_ENHANCEMENTS } from "../stillEngine";
import { stillJobProjectContentHash } from "./projectHash";
import {
  millworkRefsFromProject,
  openingRefsFromProject,
  wallRefsFromProject,
} from "./sceneRefs";
import { stillJobSnapshotId } from "./supportArtifacts";
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
  qualityPresetId?: string;
  attachments?: StillJobAttachmentRefs;
};

const DEFAULT_ENGINE: StillJobEngine = {
  id: HERO_STILL_ENGINE.id,
  version: HERO_STILL_ENGINE.version,
};

const DEFAULT_ENHANCEMENTS: StillJobAllowedEnhancement[] = [...HERO_STILL_ENHANCEMENTS];

function requireCamera(project: InteriorProject, cameraId: string): CameraEntity {
  const camera = project.cameras.find((item) => item.id === cameraId);
  if (!camera) {
    throw new Error(`StillJob camera not found: ${cameraId}`);
  }
  return camera;
}

/** Build a StillJob from authored project + locked camera. Does not mutate the project. */
export function buildStillJob(input: BuildStillJobInput): StillJob {
  const camera = requireCamera(input.project, input.cameraId);
  const projectContentHash = stillJobProjectContentHash(input.project);
  return {
    schemaVersion: STILL_JOB_SCHEMA_VERSION,
    jobId: input.jobId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    projectId: input.project.id,
    projectContentHash,
    snapshotId: stillJobSnapshotId(input.project.id, projectContentHash, camera.id),
    cameraId: camera.id,
    cameraPose: {
      eye: { ...camera.position },
      target: { ...camera.target },
      fovDeg: camera.fieldOfViewDegrees,
    },
    qualityPresetId: input.qualityPresetId ?? input.project.renderSettings.quality,
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
    millwork: millworkRefsFromProject(input.project),
    openings: openingRefsFromProject(input.project),
    walls: wallRefsFromProject(input.project),
    attachments: input.attachments ?? {},
  };
}
