/** SVG plan viewBox transform helpers (world mm). */

export type PlanViewBox = {
  minX: number;
  minZ: number;
  width: number;
  height: number;
};

export type PlanViewBounds = {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
};

/** Soft absolute limits on viewBox width (mm). */
export const PLAN_VIEW_MIN_WIDTH_MM = 200;
export const PLAN_VIEW_MAX_WIDTH_MM = 5_000_000;
export const PLAN_VIEW_ZOOM_STEP = 1.15;
export const PLAN_VIEW_DEFAULT_MARGIN_MM = 850;

export function planViewWorldPerPx(view: PlanViewBox, cssWidth: number, cssHeight: number): number {
  const w = Math.max(1, cssWidth);
  const h = Math.max(1, cssHeight);
  return Math.max(view.width / w, view.height / h);
}

/** Stable screen-space snap radius (px) for measure / semantic pointer snaps. */
export const PLAN_POINTER_SNAP_SCREEN_PX = 8;
/** Marquee click-vs-drag threshold in screen px. */
export const PLAN_MARQUEE_CLICK_SCREEN_PX = 5;
/** Wall translate click-vs-drag threshold in screen px. */
export const PLAN_WALL_MOVE_SCREEN_PX = 6;

/** Convert a screen-pixel tolerance to world mm using current mm-per-px scale. */
export function screenPxToWorldMm(screenPx: number, worldPerPx: number): number {
  return Math.max(0, screenPx) * Math.max(1e-9, worldPerPx);
}

/**
 * Pointer snap / click-drag thresholds that stay stable on screen as the user zooms.
 * At high zoom (small viewBox) world threshold shrinks; at low zoom it grows.
 */
export function planPointerSnapThresholdMm(
  view: PlanViewBox,
  cssWidth: number,
  cssHeight: number,
  screenPx = PLAN_POINTER_SNAP_SCREEN_PX,
): number {
  return screenPxToWorldMm(screenPx, planViewWorldPerPx(view, cssWidth, cssHeight));
}

/**
 * Map client (screen) coords → plan mm assuming SVG `preserveAspectRatio` default
 * `xMidYMid meet` (uniform scale + letterboxing). Prefer `clientToPlanPointFromSvg`
 * in the browser when a live SVG element is available.
 */
export function clientToPlanPoint(
  view: PlanViewBox,
  clientX: number,
  clientY: number,
  svgRect: { left: number; top: number; width: number; height: number },
): { x: number; z: number } {
  const w = Math.max(1, svgRect.width);
  const h = Math.max(1, svgRect.height);
  const scale = Math.min(w / Math.max(1e-9, view.width), h / Math.max(1e-9, view.height));
  const contentW = view.width * scale;
  const contentH = view.height * scale;
  const offsetX = (w - contentW) / 2;
  const offsetY = (h - contentH) / 2;
  return {
    x: view.minX + (clientX - svgRect.left - offsetX) / scale,
    z: view.minZ + (clientY - svgRect.top - offsetY) / scale,
  };
}

/** Inverse screen CTM — correct for meet letterboxing, pan, and zoom. */
export function clientToPlanPointFromSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; z: number } | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  try {
    const inverse = ctm.inverse();
    const point = new DOMPoint(clientX, clientY).matrixTransform(inverse);
    return { x: point.x, z: point.y };
  } catch {
    return null;
  }
}

/**
 * Zoom so the world point under (originX, originZ) stays fixed.
 * `factor` > 1 zooms in (smaller viewBox).
 */
export function zoomPlanViewToward(
  view: PlanViewBox,
  factor: number,
  originX: number,
  originZ: number,
): PlanViewBox {
  const safe = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const aspect = view.height / Math.max(1e-9, view.width);
  let width = view.width / safe;
  width = Math.min(PLAN_VIEW_MAX_WIDTH_MM, Math.max(PLAN_VIEW_MIN_WIDTH_MM, width));
  const height = width * aspect;
  const tX = (originX - view.minX) / Math.max(1e-9, view.width);
  const tZ = (originZ - view.minZ) / Math.max(1e-9, view.height);
  return {
    minX: originX - tX * width,
    minZ: originZ - tZ * height,
    width,
    height,
  };
}

export function panPlanView(view: PlanViewBox, dxWorld: number, dzWorld: number): PlanViewBox {
  return {
    ...view,
    minX: view.minX - dxWorld,
    minZ: view.minZ - dzWorld,
  };
}

/** Pan by screen pixels (positive dxPx moves content right / viewBox left). */
export function panPlanViewByScreen(
  view: PlanViewBox,
  dxPx: number,
  dyPx: number,
  cssWidth: number,
  cssHeight: number,
): PlanViewBox {
  // Uniform mm/px for xMidYMid meet (same as planViewWorldPerPx).
  const scale = planViewWorldPerPx(view, cssWidth, cssHeight);
  return panPlanView(view, dxPx * scale, dyPx * scale);
}

export function fitPlanViewToBounds(
  bounds: PlanViewBounds,
  cssWidth: number,
  cssHeight: number,
  marginMm = PLAN_VIEW_DEFAULT_MARGIN_MM,
  paddingPx = 24,
): PlanViewBox {
  const contentW = Math.max(1, bounds.maxX - bounds.minX) + marginMm * 2;
  const contentH = Math.max(1, bounds.maxZ - bounds.minZ) + marginMm * 2;
  const vw = Math.max(1, cssWidth - paddingPx * 2);
  const vh = Math.max(1, cssHeight - paddingPx * 2);
  const contentAspect = contentW / contentH;
  const viewAspect = vw / vh;
  let width: number;
  let height: number;
  if (contentAspect > viewAspect) {
    width = contentW;
    height = contentW / viewAspect;
  } else {
    height = contentH;
    width = contentH * viewAspect;
  }
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  return {
    minX: centerX - width / 2,
    minZ: centerZ - height / 2,
    width,
    height,
  };
}

export function planViewBoxString(view: PlanViewBox): string {
  return `${view.minX} ${view.minZ} ${view.width} ${view.height}`;
}

export function boundsFromPoints(points: ReadonlyArray<{ x: number; z: number }>): PlanViewBounds | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minZ = Math.min(minZ, p.z);
    maxX = Math.max(maxX, p.x);
    maxZ = Math.max(maxZ, p.z);
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minZ, maxX, maxZ };
}

export function expandBounds(bounds: PlanViewBounds, padMm: number): PlanViewBounds {
  return {
    minX: bounds.minX - padMm,
    minZ: bounds.minZ - padMm,
    maxX: bounds.maxX + padMm,
    maxZ: bounds.maxZ + padMm,
  };
}

export function rectsIntersect(
  a: { minX: number; minZ: number; maxX: number; maxZ: number },
  b: { minX: number; minZ: number; maxX: number; maxZ: number },
): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}
