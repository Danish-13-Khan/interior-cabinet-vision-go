const MIN_FOV = 18;
const MAX_FOV = 70;
const STEP = 4;

/** Perspective zoom for the model camera. In moves closer by narrowing the field of view. */
export function nextModelFieldOfView(current: number, direction: "in" | "out") {
  const next = direction === "in" ? current - STEP : current + STEP;
  return Math.min(MAX_FOV, Math.max(MIN_FOV, next));
}
