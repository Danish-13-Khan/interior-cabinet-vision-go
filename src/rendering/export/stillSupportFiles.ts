/** Filename helpers for StillJob support plates (WebGL capture fills these later). */
export function stillSupportFileNames(jobId: string) {
  return {
    heroPlate: `${jobId}-hero-plate.png`,
    depth: `${jobId}-depth.png`,
    normal: `${jobId}-normal.png`,
    materialIds: `${jobId}-material-ids.json`,
  };
}
