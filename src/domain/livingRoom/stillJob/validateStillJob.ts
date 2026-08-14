import type { InteriorProject, Point3Mm } from "../../interiorProject";
import { stillJobProjectContentHash } from "./projectHash";
import { STILL_JOB_TOLERANCES } from "./tolerances";
import {
  STILL_JOB_SCHEMA_VERSION,
  type StillJob,
  type StillJobCameraPose,
  type StillJobGateResult,
  type StillJobValidation,
} from "./types";

function distance3(a: Point3Mm, b: Point3Mm) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

function planDistance(a: Point3Mm, b: Point3Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function gate(
  id: StillJobGateResult["id"],
  pass: boolean,
  detail: string,
  measured?: number,
  limit?: number,
): StillJobGateResult {
  return { id, pass, detail, measured, limit };
}

/**
 * Round-trip / faithfulness checks: StillJob (or claimed still pose) vs authored project.
 * Spike covers camera + object set + materials; millwork/opening deltas deferred.
 */
export function validateStillJobAgainstProject(
  job: StillJob,
  project: InteriorProject,
  claimedPose?: StillJobCameraPose,
): StillJobValidation {
  const pose = claimedPose ?? job.cameraPose;
  const camera = project.cameras.find((item) => item.id === job.cameraId);
  const expectedHash = stillJobProjectContentHash(project);
  const gates: StillJobGateResult[] = [];

  gates.push(
    gate(
      "schema",
      job.schemaVersion === STILL_JOB_SCHEMA_VERSION,
      `schemaVersion=${job.schemaVersion}`,
    ),
  );

  gates.push(
    gate(
      "project_hash",
      job.projectContentHash === expectedHash && job.projectId === project.id,
      job.projectContentHash === expectedHash
        ? "project hash matches"
        : `hash mismatch job=${job.projectContentHash} expected=${expectedHash}`,
    ),
  );

  gates.push(
    gate(
      "camera_id",
      Boolean(camera),
      camera ? `camera ${job.cameraId}` : `missing camera ${job.cameraId}`,
    ),
  );

  if (camera) {
    const eyeErr = distance3(pose.eye, camera.position);
    const targetErr = distance3(pose.target, camera.target);
    const fovErr = Math.abs(pose.fovDeg - camera.fieldOfViewDegrees);

    gates.push(
      gate(
        "camera_eye",
        eyeErr <= STILL_JOB_TOLERANCES.cameraEyeMm,
        `eye Δ=${eyeErr.toFixed(2)} mm`,
        eyeErr,
        STILL_JOB_TOLERANCES.cameraEyeMm,
      ),
    );
    gates.push(
      gate(
        "camera_target",
        targetErr <= STILL_JOB_TOLERANCES.cameraTargetMm,
        `target Δ=${targetErr.toFixed(2)} mm`,
        targetErr,
        STILL_JOB_TOLERANCES.cameraTargetMm,
      ),
    );
    gates.push(
      gate(
        "camera_fov",
        fovErr <= STILL_JOB_TOLERANCES.cameraFovDeg,
        `fov Δ=${fovErr.toFixed(3)}°`,
        fovErr,
        STILL_JOB_TOLERANCES.cameraFovDeg,
      ),
    );
  }

  const projectIds = new Set(project.objects.map((item) => item.id));
  const jobIds = new Set(job.objects.map((item) => item.id));
  const missing = [...projectIds].filter((id) => !jobIds.has(id));
  const extra = [...jobIds].filter((id) => !projectIds.has(id));
  gates.push(
    gate(
      "object_set",
      missing.length === 0 && extra.length === 0,
      missing.length || extra.length
        ? `missing=${missing.join(",") || "—"} extra=${extra.join(",") || "—"}`
        : `object count=${job.objects.length}`,
    ),
  );

  let worstPlan = 0;
  let worstHeight = 0;
  for (const ref of job.objects) {
    const object = project.objects.find((item) => item.id === ref.id);
    if (!object) continue;
    worstPlan = Math.max(
      worstPlan,
      planDistance(ref.position, object.position),
    );
    worstHeight = Math.max(
      worstHeight,
      Math.abs(ref.position.y - object.position.y),
    );
  }
  gates.push(
    gate(
      "object_placement",
      worstPlan <= STILL_JOB_TOLERANCES.objectPlanCentroidMm,
      `worst plan Δ=${worstPlan.toFixed(2)} mm`,
      worstPlan,
      STILL_JOB_TOLERANCES.objectPlanCentroidMm,
    ),
  );
  gates.push(
    gate(
      "object_height",
      worstHeight <= STILL_JOB_TOLERANCES.objectHeightMm,
      `worst height Δ=${worstHeight.toFixed(2)} mm`,
      worstHeight,
      STILL_JOB_TOLERANCES.objectHeightMm,
    ),
  );

  const projectMaterialIds = new Set(project.materials.map((item) => item.id));
  const materialOk =
    job.materials.length === project.materials.length &&
    job.materials.every((slot) => projectMaterialIds.has(slot.materialId));
  gates.push(
    gate(
      "material_ids",
      materialOk,
      materialOk
        ? `materials=${job.materials.length}`
        : "material id list does not match project",
    ),
  );

  return {
    ok: gates.every((item) => item.pass),
    gates,
    tolerances: STILL_JOB_TOLERANCES,
  };
}
