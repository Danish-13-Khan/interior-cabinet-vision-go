/** Perspective projection of world AABBs to normalised device coordinates. */

import type { Point3Mm } from "../interiorProject";
import { aabbCornersMm } from "./modelViewFitDistance";
import type { AabbMm } from "./sceneNodeBounds";

export type CameraPoseMm = { position: Point3Mm; target: Point3Mm; fieldOfViewDegrees: number };

export type ScreenBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Every corner is in front of the camera. */
  inFront: boolean;
};

function sub(a: Point3Mm, b: Point3Mm): Point3Mm {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function dot(a: Point3Mm, b: Point3Mm) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a: Point3Mm, b: Point3Mm): Point3Mm {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function normalize(v: Point3Mm): Point3Mm {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

export function projectAabbToScreen(pose: CameraPoseMm, aspect: number, box: AabbMm): ScreenBounds {
  const forward = normalize(sub(pose.target, pose.position));
  const upRef = Math.abs(forward.y) > 0.98 ? { x: 0, y: 0, z: -1 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(forward, upRef));
  const up = cross(right, forward);
  const halfV = Math.tan((Math.max(pose.fieldOfViewDegrees, 8) * Math.PI) / 360);
  const halfH = halfV * Math.max(aspect, 0.05);
  const result: ScreenBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, inFront: true };
  for (const corner of aabbCornersMm(box.min, box.max)) {
    const relative = sub(corner, pose.position);
    const depth = dot(relative, forward);
    if (depth <= 1) result.inFront = false;
    const ndcX = dot(relative, right) / (Math.max(depth, 1) * halfH);
    const ndcY = dot(relative, up) / (Math.max(depth, 1) * halfV);
    result.minX = Math.min(result.minX, ndcX);
    result.maxX = Math.max(result.maxX, ndcX);
    result.minY = Math.min(result.minY, ndcY);
    result.maxY = Math.max(result.maxY, ndcY);
  }
  return result;
}

/** True when the whole box projects inside the frame (with an optional NDC margin). */
export function screenBoundsInsideFrame(bounds: ScreenBounds, margin = 0): boolean {
  const limit = 1 - margin;
  return bounds.inFront
    && bounds.minX >= -limit && bounds.maxX <= limit
    && bounds.minY >= -limit && bounds.maxY <= limit;
}

/** Larger of the width / height fraction the box covers (0–1). */
export function screenBoundsFill(bounds: ScreenBounds): number {
  return Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2);
}
