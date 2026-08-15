import type { InteriorProject } from "../../interiorProject";
import { stillJobProjectContentHash } from "./projectHash";
import { STILL_JOB_TOLERANCES } from "./tolerances";
import { distance3, gate } from "./qaHelpers";
import {
  millworkFidelityGate,
  objectFidelityGates,
  openingWallFidelityGate,
} from "./validateFidelity";
import {
  STILL_JOB_SCHEMA_VERSION,
  type StillJob,
  type StillJobCameraPose,
  type StillJobGateResult,
  type StillJobValidation,
} from "./types";

function cameraGates(
  job: StillJob,
  project: InteriorProject,
  pose: StillJobCameraPose,
): StillJobGateResult[] {
  const camera = project.cameras.find((item) => item.id === job.cameraId);
  const gates: StillJobGateResult[] = [
    gate("camera_id", Boolean(camera), camera ? `camera ${job.cameraId}` : `missing camera ${job.cameraId}`),
  ];
  if (!camera) return gates;
  const eyeErr = distance3(pose.eye, camera.position);
  const targetErr = distance3(pose.target, camera.target);
  const fovErr = Math.abs(pose.fovDeg - camera.fieldOfViewDegrees);
  gates.push(
    gate("camera_eye", eyeErr <= STILL_JOB_TOLERANCES.cameraEyeMm, `eye Δ=${eyeErr.toFixed(2)} mm`, eyeErr, STILL_JOB_TOLERANCES.cameraEyeMm),
    gate("camera_target", targetErr <= STILL_JOB_TOLERANCES.cameraTargetMm, `target Δ=${targetErr.toFixed(2)} mm`, targetErr, STILL_JOB_TOLERANCES.cameraTargetMm),
    gate("camera_fov", fovErr <= STILL_JOB_TOLERANCES.cameraFovDeg, `fov Δ=${fovErr.toFixed(3)}°`, fovErr, STILL_JOB_TOLERANCES.cameraFovDeg),
  );
  return gates;
}

/**
 * Faithfulness checks: StillJob (or claimed still pose) vs authored project.
 * Does not mutate InteriorProject.
 */
export function validateStillJobAgainstProject(
  job: StillJob,
  project: InteriorProject,
  claimedPose?: StillJobCameraPose,
): StillJobValidation {
  const expectedHash = stillJobProjectContentHash(project);
  const hashOk = job.projectContentHash === expectedHash && job.projectId === project.id;
  const projectMaterialIds = new Set(project.materials.map((item) => item.id));
  const materialOk =
    job.materials.length === project.materials.length &&
    job.materials.every((slot) => projectMaterialIds.has(slot.materialId));

  const gates: StillJobGateResult[] = [
    gate("schema", job.schemaVersion === STILL_JOB_SCHEMA_VERSION, `schemaVersion=${job.schemaVersion}`),
    gate(
      "project_hash",
      hashOk,
      hashOk ? "project hash matches" : `hash mismatch job=${job.projectContentHash} expected=${expectedHash}`,
    ),
    ...cameraGates(job, project, claimedPose ?? job.cameraPose),
    ...objectFidelityGates(job, project),
    millworkFidelityGate(job, project),
    openingWallFidelityGate(job, project),
    gate(
      "material_ids",
      materialOk,
      materialOk ? `materials=${job.materials.length}` : "material id list does not match project",
    ),
  ];

  return {
    ok: gates.every((item) => item.pass),
    gates,
    tolerances: STILL_JOB_TOLERANCES,
  };
}
