/** Ignore collapsed SVG frames so Fit does not explode the viewBox. */
export const PLAN_CANVAS_MIN_CSS_PX = 80;

export function planCanvasCssSize(
  rect?: { width: number; height: number } | null,
): { width: number; height: number } | null {
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  if (width < PLAN_CANVAS_MIN_CSS_PX || height < PLAN_CANVAS_MIN_CSS_PX) return null;
  return { width, height };
}
