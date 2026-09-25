import { aabbFitDistanceMm, offsetFromTargetMm } from "./modelViewFitDistance";
import type { ModelViewPose, ModelViewPresetId } from "./modelViewPresets";
import type { CompiledSceneBounds } from "./sceneTypes";
import { WALKTHROUGH_EYE_HEIGHT_MM } from "./modelViewCameraOverrides";

/** Extra distance so the fitted room fills about 70–80% of the limiting edge. */
const FRAME_PADDING = 1.08;
const WALL_CLEAR_MM = 200;

const VIEW_FROM_TARGET: Record<Exclude<ModelViewPresetId, "walkthrough">, { x: number; y: number; z: number }> = {
  perspective: { x: 0.7, y: 0.46, z: 1 },
  isometric: { x: 1, y: 1, z: 1 },
  front: { x: 0, y: 0.18, z: 1 },
  side: { x: -1, y: 0.18, z: 0 },
  top: { x: 0, y: 1, z: 0.05 },
  dollhouse: { x: 0.92, y: 0.8, z: 1 },
  orbit: { x: 1.15, y: 0.48, z: 0.5 },
};

export type ExteriorFrame = ModelViewPose & { spanMm: number; orthographicZoom?: number };

export function resolveExteriorFrame(
  bounds: CompiledSceneBounds,
  preset: ModelViewPresetId,
  viewport: { widthPx: number; heightPx: number },
  fieldOfViewDegrees = 42,
): ExteriorFrame {
  if (preset === "walkthrough") return walkthroughFrame(bounds, fieldOfViewDegrees);
  const direction = VIEW_FROM_TARGET[preset];
  const target = {
    x: bounds.center.x,
    y: bounds.center.y + bounds.size.heightMm * (preset === "top" ? 0 : 0.08),
    z: bounds.center.z,
  };
  const fov = preset === "isometric" ? 35 : preset === "top" ? 38 : fieldOfViewDegrees;
  const aspect = viewport.widthPx / Math.max(viewport.heightPx, 1);
  const padding = preset === "front" || preset === "top" ? 1.2 : preset === "orbit" ? 1.02 : FRAME_PADDING;
  const distance = aabbFitDistanceMm({
    min: bounds.min,
    max: bounds.max,
    viewFromTarget: direction,
    fovDegrees: fov,
    aspect,
    padding,
  });
  const spanMm = Math.max(bounds.size.widthMm, bounds.size.depthMm, bounds.size.heightMm, 1200);
  return {
    position: offsetFromTargetMm(target, direction, distance),
    target,
    fieldOfViewDegrees: fov,
    spanMm,
    orthographicZoom: preset === "isometric"
      ? isometricZoom(bounds, target, direction, viewport)
      : undefined,
  };
}

function isometricZoom(
  bounds: CompiledSceneBounds,
  target: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
  viewport: { widthPx: number; heightPx: number },
) {
  const forward = normalize(direction);
  const upRef = Math.abs(forward.y) > 0.92 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(forward, upRef));
  const up = cross(right, forward);
  let maxX = 1;
  let maxY = 1;
  for (const corner of boxCorners(bounds)) {
    const relative = sub(corner, target);
    maxX = Math.max(maxX, Math.abs(dot(relative, right)));
    maxY = Math.max(maxY, Math.abs(dot(relative, up)));
  }
  const fill = 0.78;
  const zoomX = (viewport.widthPx / 2) * 1000 * fill / maxX;
  const zoomY = (viewport.heightPx / 2) * 1000 * fill / maxY;
  return Math.max(8, Math.min(zoomX, zoomY));
}

function walkthroughFrame(bounds: CompiledSceneBounds, fov: number): ExteriorFrame {
  const insetX = Math.min(Math.max(WALL_CLEAR_MM, bounds.size.widthMm * 0.12), bounds.size.widthMm * 0.35);
  const insetZ = Math.min(Math.max(WALL_CLEAR_MM, bounds.size.depthMm * 0.18), bounds.size.depthMm * 0.35);
  const y = Math.min(
    Math.max(bounds.min.y + 400, WALKTHROUGH_EYE_HEIGHT_MM),
    bounds.max.y - 300,
  );
  const position = {
    x: bounds.min.x + insetX,
    y,
    z: bounds.min.z + insetZ,
  };
  return {
    position,
    target: { x: bounds.max.x - insetX, y, z: bounds.max.z - insetZ },
    fieldOfViewDegrees: fov,
    spanMm: Math.max(bounds.size.widthMm, bounds.size.depthMm, 1200),
  };
}

export function cameraClearsWallVolume(
  bounds: CompiledSceneBounds,
  position: { x: number; y: number; z: number },
  inside: boolean,
): boolean {
  const minX = bounds.min.x + (inside ? WALL_CLEAR_MM : -WALL_CLEAR_MM);
  const maxX = bounds.max.x - (inside ? WALL_CLEAR_MM : -WALL_CLEAR_MM);
  const minY = bounds.min.y + (inside ? 80 : -WALL_CLEAR_MM);
  const maxY = bounds.max.y - (inside ? 80 : -WALL_CLEAR_MM);
  const minZ = bounds.min.z + (inside ? WALL_CLEAR_MM : -WALL_CLEAR_MM);
  const maxZ = bounds.max.z - (inside ? WALL_CLEAR_MM : -WALL_CLEAR_MM);
  const contained = position.x > minX && position.x < maxX
    && position.y > minY && position.y < maxY
    && position.z > minZ && position.z < maxZ;
  return inside ? contained : !contained;
}

/** Fraction of the viewport covered by the projected room AABB. */
export function projectedRoomCoverage(input: {
  bounds: CompiledSceneBounds;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fovDegrees: number;
  widthPx: number;
  heightPx: number;
  orthographicZoom?: number;
}): { width: number; height: number; area: number } {
  const corners = boxCorners(input.bounds);
  const forward = normalize(sub(input.target, input.position));
  const upRef = Math.abs(forward.y) > 0.92 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(forward, upRef));
  const up = cross(right, forward);
  const aspect = input.widthPx / Math.max(input.heightPx, 1);
  const halfV = Math.tan((Math.max(input.fovDegrees, 8) * Math.PI) / 360);
  const halfH = halfV * aspect;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    const relative = sub(corner, input.position);
    const depth = dot(relative, forward);
    const x = dot(relative, right);
    const y = dot(relative, up);
    const ndcX = input.orthographicZoom
      ? x / ((input.widthPx / 2 / input.orthographicZoom) * 1000)
      : x / (Math.max(depth, 1) * halfH);
    const ndcY = input.orthographicZoom
      ? y / ((input.heightPx / 2 / input.orthographicZoom) * 1000)
      : y / (Math.max(depth, 1) * halfV);
    minX = Math.min(minX, ndcX);
    maxX = Math.max(maxX, ndcX);
    minY = Math.min(minY, ndcY);
    maxY = Math.max(maxY, ndcY);
  }
  const width = Math.max(0, Math.min(1, maxX) - Math.max(-1, minX)) / 2;
  const height = Math.max(0, Math.min(1, maxY) - Math.max(-1, minY)) / 2;
  return { width, height, area: width * height };
}

function boxCorners(bounds: CompiledSceneBounds) {
  const { min, max } = bounds;
  return [
    { x: min.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: min.z },
    { x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: min.y, z: max.z }, { x: max.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: max.z }, { x: max.x, y: max.y, z: max.z },
  ];
}

function sub(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function normalize(vector: { x: number; y: number; z: number }) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function modelViewFogMeters(spanMeters: number, nearMm: number, farMm: number) {
  const near = Math.max(nearMm / 1000, spanMeters * 2.2);
  const far = Math.max(farMm / 1000, near + spanMeters * 2.5);
  return { near, far };
}
