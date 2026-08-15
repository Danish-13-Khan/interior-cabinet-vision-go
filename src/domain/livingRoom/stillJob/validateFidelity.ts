import type { InteriorProject } from "../../interiorProject";
import { STILL_JOB_TOLERANCES } from "./tolerances";
import { gate, planDistance, planVertexDistance } from "./qaHelpers";
import type { StillJob, StillJobGateResult } from "./types";

function idSetMismatch(
  expected: string[],
  actual: string[],
): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    missing: expected.filter((id) => !actualSet.has(id)),
    extra: actual.filter((id) => !expectedSet.has(id)),
  };
}

export function objectFidelityGates(job: StillJob, project: InteriorProject): StillJobGateResult[] {
  const { missing, extra } = idSetMismatch(
    project.objects.map((item) => item.id),
    job.objects.map((item) => item.id),
  );
  let worstPlan = 0;
  let worstHeight = 0;
  for (const ref of job.objects) {
    const object = project.objects.find((item) => item.id === ref.id);
    if (!object) continue;
    worstPlan = Math.max(worstPlan, planDistance(ref.position, object.position));
    worstHeight = Math.max(worstHeight, Math.abs(ref.position.y - object.position.y));
  }
  return [
    gate(
      "object_set",
      missing.length === 0 && extra.length === 0,
      missing.length || extra.length
        ? `missing=${missing.join(",") || "—"} extra=${extra.join(",") || "—"}`
        : `object count=${job.objects.length}`,
    ),
    gate(
      "object_placement",
      worstPlan <= STILL_JOB_TOLERANCES.objectPlanCentroidMm,
      `worst plan Δ=${worstPlan.toFixed(2)} mm`,
      worstPlan,
      STILL_JOB_TOLERANCES.objectPlanCentroidMm,
    ),
    gate(
      "object_height",
      worstHeight <= STILL_JOB_TOLERANCES.objectHeightMm,
      `worst height Δ=${worstHeight.toFixed(2)} mm`,
      worstHeight,
      STILL_JOB_TOLERANCES.objectHeightMm,
    ),
  ];
}

export function millworkFidelityGate(job: StillJob, project: InteriorProject): StillJobGateResult {
  let worst = 0;
  for (const ref of job.millwork) {
    const object = project.objects.find((item) => item.id === ref.id);
    if (!object) {
      return gate("millwork_size", false, `missing millwork ${ref.id}`);
    }
    worst = Math.max(
      worst,
      Math.abs(ref.size.w - object.dimensions.widthMm),
      Math.abs(ref.size.h - object.dimensions.heightMm),
      Math.abs(ref.size.d - object.dimensions.depthMm),
    );
  }
  return gate(
    "millwork_size",
    worst <= STILL_JOB_TOLERANCES.millworkSizeMm,
    `worst millwork Δ=${worst.toFixed(2)} mm`,
    worst,
    STILL_JOB_TOLERANCES.millworkSizeMm,
  );
}

export function openingWallFidelityGate(
  job: StillJob,
  project: InteriorProject,
): StillJobGateResult {
  const openings = idSetMismatch(
    project.openings.map((item) => item.id),
    job.openings.map((item) => item.id),
  );
  const walls = idSetMismatch(
    project.walls.map((item) => item.id),
    job.walls.map((item) => item.id),
  );
  if (openings.missing.length || openings.extra.length || walls.missing.length || walls.extra.length) {
    return gate(
      "opening_wall",
      false,
      `openings missing=${openings.missing.join(",") || "—"} extra=${openings.extra.join(",") || "—"} walls missing=${walls.missing.join(",") || "—"} extra=${walls.extra.join(",") || "—"}`,
    );
  }
  let worst = 0;
  for (const ref of job.walls) {
    const wall = project.walls.find((item) => item.id === ref.id);
    if (!wall) continue;
    worst = Math.max(
      worst,
      planVertexDistance(ref.start, wall.start),
      planVertexDistance(ref.end, wall.end),
    );
  }
  for (const ref of job.openings) {
    const opening = project.openings.find((item) => item.id === ref.id);
    if (!opening) continue;
    worst = Math.max(
      worst,
      Math.abs(ref.offsetMm - opening.offsetMm),
      Math.abs(ref.widthMm - opening.widthMm),
    );
  }
  return gate(
    "opening_wall",
    worst <= STILL_JOB_TOLERANCES.openingWallPlanMm,
    `worst opening/wall Δ=${worst.toFixed(2)} mm`,
    worst,
    STILL_JOB_TOLERANCES.openingWallPlanMm,
  );
}
