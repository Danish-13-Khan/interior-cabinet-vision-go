/** Distance that fills the viewport with an AABB, given FOV and aspect. */

export const MODEL_VIEW_FIT_PADDING = 1.14;
export const MODEL_VIEW_FIT_MIN_DISTANCE_MM = 280;

export type FitPoint3 = { x: number; y: number; z: number };

export function fitFrameSizeMm(size: {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}): { widthMm: number; heightMm: number } {
  return {
    widthMm: Math.max(size.widthMm, size.depthMm, 1),
    heightMm: Math.max(size.heightMm, 1),
  };
}

export function frustumFitDistanceMm(input: {
  widthMm: number;
  heightMm: number;
  fovDegrees: number;
  aspect: number;
  padding?: number;
}): number {
  const padding = input.padding ?? MODEL_VIEW_FIT_PADDING;
  const fov = Math.max(input.fovDegrees, 8) * (Math.PI / 180);
  const aspect = Math.max(input.aspect, 0.05);
  const halfVertical = Math.tan(fov / 2);
  const halfHorizontal = halfVertical * aspect;
  const byHeight = (input.heightMm / 2) / halfVertical;
  const byWidth = (input.widthMm / 2) / halfHorizontal;
  return Math.max(byHeight, byWidth, MODEL_VIEW_FIT_MIN_DISTANCE_MM) * padding;
}

export function aabbCornersMm(min: FitPoint3, max: FitPoint3): FitPoint3[] {
  return [
    { x: min.x, y: min.y, z: min.z }, { x: max.x, y: min.y, z: min.z },
    { x: min.x, y: max.y, z: min.z }, { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: min.y, z: max.z }, { x: max.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: max.z }, { x: max.x, y: max.y, z: max.z },
  ];
}

function normalize(vector: FitPoint3): FitPoint3 {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function cross(a: FitPoint3, b: FitPoint3): FitPoint3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function cameraBasis(viewFromTarget: FitPoint3) {
  const toCamera = normalize(viewFromTarget);
  const forward = { x: -toCamera.x, y: -toCamera.y, z: -toCamera.z };
  const worldUp = Math.abs(toCamera.y) > 0.92
    ? { x: 0, y: 0, z: 1 }
    : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(forward, worldUp));
  const up = cross(right, forward);
  return { toCamera, right, up };
}

/** Distance along `viewFromTarget` so all eight AABB corners fit the frustum. */
export function aabbFitDistanceMm(input: {
  min: FitPoint3;
  max: FitPoint3;
  viewFromTarget: FitPoint3;
  fovDegrees: number;
  aspect: number;
  padding?: number;
}): number {
  const padding = input.padding ?? MODEL_VIEW_FIT_PADDING;
  const fov = Math.max(input.fovDegrees, 8) * (Math.PI / 180);
  const aspect = Math.max(input.aspect, 0.05);
  const halfVertical = Math.tan(fov / 2);
  const halfHorizontal = halfVertical * aspect;
  const { toCamera, right, up } = cameraBasis(input.viewFromTarget);
  const center = {
    x: (input.min.x + input.max.x) / 2,
    y: (input.min.y + input.max.y) / 2,
    z: (input.min.z + input.max.z) / 2,
  };
  let distance = MODEL_VIEW_FIT_MIN_DISTANCE_MM;
  for (const corner of aabbCornersMm(input.min, input.max)) {
    const rx = corner.x - center.x;
    const ry = corner.y - center.y;
    const rz = corner.z - center.z;
    const along = rx * toCamera.x + ry * toCamera.y + rz * toCamera.z;
    const x = rx * right.x + ry * right.y + rz * right.z;
    const y = rx * up.x + ry * up.y + rz * up.z;
    distance = Math.max(
      distance,
      along + Math.abs(x) / halfHorizontal,
      along + Math.abs(y) / halfVertical,
    );
  }
  return distance * padding;
}

export function selectionFitDistanceMm(
  size: { widthMm: number; heightMm: number; depthMm: number },
  view: { widthPx: number; heightPx: number; fieldOfViewDegrees?: number } | undefined,
  fallbackSpanMm: number,
  fovFallback: number,
): number {
  if (!view) return Math.max(fallbackSpanMm * 1.35, MODEL_VIEW_FIT_MIN_DISTANCE_MM);
  const frame = fitFrameSizeMm(size);
  return frustumFitDistanceMm({
    widthMm: frame.widthMm,
    heightMm: frame.heightMm,
    fovDegrees: view.fieldOfViewDegrees ?? fovFallback,
    aspect: view.widthPx / Math.max(view.heightPx, 1),
  });
}

export function offsetFromTargetMm(
  target: FitPoint3,
  direction: FitPoint3,
  distanceMm: number,
): FitPoint3 {
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  return {
    x: target.x + (direction.x / length) * distanceMm,
    y: target.y + (direction.y / length) * distanceMm,
    z: target.z + (direction.z / length) * distanceMm,
  };
}

/** Extra travel when OrbitControls clamps zoom-in to minDistance. */
export function dollyBlockedByMinDistance(
  currentDistance: number,
  scale: number,
  minDistance: number,
): number {
  if (!(scale > 0) || scale >= 1) return 0;
  return Math.max(0, minDistance - currentDistance * scale);
}

export function orbitWheelZoomScale(zoomSpeed: number): number {
  return Math.pow(0.95, Math.max(zoomSpeed, 0.01));
}
