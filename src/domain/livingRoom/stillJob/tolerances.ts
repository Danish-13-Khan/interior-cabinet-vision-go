/** Numeric QA gates from docs/STILLJOB_TRUST_CONTRACT.md §3.1 (project units = mm). */
export const STILL_JOB_TOLERANCES = {
  cameraEyeMm: 25,
  cameraTargetMm: 40,
  cameraFovDeg: 0.5,
  objectPlanCentroidMm: 50,
  objectHeightMm: 20,
  millworkSizeMm: 2,
  openingWallPlanMm: 15,
} as const;

export type StillJobToleranceKey = keyof typeof STILL_JOB_TOLERANCES;
