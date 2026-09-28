/** World-space AABBs for compiled scene nodes (mm), matching three.js Y rotation. */

import type { Point3Mm } from "../interiorProject";
import type { CompiledPrimitive, CompiledSceneNode } from "./sceneTypes";

export type AabbMm = { min: Point3Mm; max: Point3Mm };

function rotateY(point: Point3Mm, degrees: number): Point3Mm {
  if (!degrees) return point;
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: point.x * cos + point.z * sin, y: point.y, z: -point.x * sin + point.z * cos };
}

function primitiveHalfExtents(primitive: CompiledPrimitive): { x: number; y: number; z: number; baseY: number } {
  if (primitive.kind === "box" || primitive.kind === "rounded-box") {
    const { width, height, depth } = primitive.sizeMm;
    return { x: width / 2, y: height / 2, z: depth / 2, baseY: 0 };
  }
  if (primitive.kind === "cylinder") {
    const radius = Math.max(primitive.radiusTopMm, primitive.radiusBottomMm);
    return { x: radius, y: primitive.heightMm / 2, z: radius, baseY: 0 };
  }
  return {
    x: primitive.boundsMm.width / 2,
    y: primitive.heightMm / 2,
    z: primitive.boundsMm.depth / 2,
    baseY: primitive.heightMm / 2,
  };
}

function emptyAabb(): AabbMm {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}

function include(box: AabbMm, point: Point3Mm) {
  box.min = { x: Math.min(box.min.x, point.x), y: Math.min(box.min.y, point.y), z: Math.min(box.min.z, point.z) };
  box.max = { x: Math.max(box.max.x, point.x), y: Math.max(box.max.y, point.y), z: Math.max(box.max.z, point.z) };
}

function isFinite3(box: AabbMm) {
  return Number.isFinite(box.min.x) && Number.isFinite(box.max.x);
}

export function sceneNodeAabbMm(node: CompiledSceneNode): AabbMm | null {
  const box = emptyAabb();
  const nodeYaw = node.rotationDegrees?.y ?? 0;
  for (const primitive of node.primitives) {
    const half = primitiveHalfExtents(primitive);
    const primYaw = primitive.rotationDegrees?.y ?? 0;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const local = rotateY({ x: sx * half.x, y: sy * half.y + half.baseY, z: sz * half.z }, primYaw);
          const inNode = {
            x: local.x + primitive.positionMm.x,
            y: local.y + primitive.positionMm.y,
            z: local.z + primitive.positionMm.z,
          };
          const world = rotateY(inNode, nodeYaw);
          include(box, {
            x: world.x + node.positionMm.x,
            y: world.y + node.positionMm.y,
            z: world.z + node.positionMm.z,
          });
        }
      }
    }
  }
  return isFinite3(box) ? box : null;
}

/** Cabinet / filler nodes produced by the cabinet adapter. */
export function isCabinetSceneNode(node: CompiledSceneNode): boolean {
  const meta = node.metadata;
  return Boolean(node.sourceObjectId)
    && (typeof meta.cabinetType === "string" || typeof meta.geometry === "string" || meta.category === "filler");
}

export function unionAabbMm(boxes: readonly AabbMm[]): AabbMm | null {
  if (!boxes.length) return null;
  const box = emptyAabb();
  for (const item of boxes) {
    include(box, item.min);
    include(box, item.max);
  }
  return box;
}

export function cabinetSceneBoundsMm(nodes: readonly CompiledSceneNode[]): AabbMm | null {
  return unionAabbMm(
    nodes.filter(isCabinetSceneNode)
      .map(sceneNodeAabbMm)
      .filter((box): box is AabbMm => Boolean(box)),
  );
}
