import type { Point3Mm } from "../../interiorProject";
import { STILL_JOB_TOLERANCES } from "./tolerances";
import type {
  StillJobMillworkRef,
  StillJobOpeningRef,
  StillJobWallRef,
} from "./sceneRefs";

export const STILL_JOB_SCHEMA_VERSION = 2 as const;
export const STILL_JOB_CONTRACT_NOTE =
  "The still may look prettier; it may not lie about what was authored.";

export type StillJobAllowedEnhancement =
  | "soft_shadows"
  | "material_micro_detail"
  | "exposure_grade"
  | "window_background";

export type StillJobMode = "faithful_enhance" | "marketing_stylize";

export type StillJobEngine = {
  id: string;
  version: string;
};

export type StillJobCameraPose = {
  eye: Point3Mm;
  target: Point3Mm;
  fovDeg: number;
};

export type StillJobMaterialSlot = {
  materialId: string;
  name: string;
  type: string;
};

export type StillJobObjectRef = {
  id: string;
  catalogItemId?: string;
  category: string;
  position: Point3Mm;
  rotationYDeg: number;
  size: { w: number; d: number; h: number };
};

/** Paths relative to the job package / fixture folder. PNG bytes are not embedded. */
export type StillJobAttachmentRefs = {
  heroPngPath?: string;
  depthPath?: string;
  normalPath?: string;
  materialIdMapPath?: string;
};

export type StillJob = {
  schemaVersion: typeof STILL_JOB_SCHEMA_VERSION;
  jobId: string;
  createdAt: string;
  projectId: string;
  projectContentHash: string;
  snapshotId: string;
  cameraId: string;
  cameraPose: StillJobCameraPose;
  qualityPresetId: string;
  lightingRecipeId: string;
  styleIds: string[];
  seed: number;
  engine: StillJobEngine;
  allowedEnhancements: StillJobAllowedEnhancement[];
  mode: StillJobMode;
  forbiddenChangesNote: string;
  materials: StillJobMaterialSlot[];
  objects: StillJobObjectRef[];
  millwork: StillJobMillworkRef[];
  openings: StillJobOpeningRef[];
  walls: StillJobWallRef[];
  attachments: StillJobAttachmentRefs;
};

export type StillJobGateId =
  | "schema"
  | "project_hash"
  | "camera_id"
  | "camera_eye"
  | "camera_target"
  | "camera_fov"
  | "object_set"
  | "object_placement"
  | "object_height"
  | "material_ids"
  | "millwork_size"
  | "opening_wall";

export type StillJobGateResult = {
  id: StillJobGateId;
  pass: boolean;
  detail: string;
  measured?: number;
  limit?: number;
};

export type StillJobValidation = {
  ok: boolean;
  gates: StillJobGateResult[];
  tolerances: typeof STILL_JOB_TOLERANCES;
};
