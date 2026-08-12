import type { Point3Mm } from "../interiorProject";
import type { CompiledSceneBounds, CompiledSceneNode } from "./sceneTypes";

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function rotateLocalPoint(point: Point3Mm, rotationY: number) {
  const radians = rotationY * Math.PI / 180;
  return {
    x: point.x * Math.cos(radians) + point.z * Math.sin(radians),
    z: -point.x * Math.sin(radians) + point.z * Math.cos(radians),
  };
}

export function computeCompiledSceneBounds(
  nodes: CompiledSceneNode[],
): CompiledSceneBounds {
  const min: Point3Mm = { x: Infinity, y: Infinity, z: Infinity };
  const max: Point3Mm = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const node of nodes) {
    for (const primitive of node.primitives) {
      const width = primitive.kind !== "cylinder"
        ? primitive.sizeMm.width
        : primitive.radiusBottomMm * 2;
      const depth = primitive.kind !== "cylinder"
        ? primitive.sizeMm.depth
        : primitive.radiusBottomMm * 2;
      const height = primitive.kind !== "cylinder" ? primitive.sizeMm.height : primitive.heightMm;
      const rotation = node.rotationDegrees.y + primitive.rotationDegrees.y;
      const radians = rotation * Math.PI / 180;
      const halfX = Math.abs(Math.cos(radians)) * width / 2 + Math.abs(Math.sin(radians)) * depth / 2;
      const halfZ = Math.abs(Math.sin(radians)) * width / 2 + Math.abs(Math.cos(radians)) * depth / 2;
      const local = rotateLocalPoint(primitive.positionMm, node.rotationDegrees.y);
      const center = {
        x: node.positionMm.x + local.x,
        y: node.positionMm.y + primitive.positionMm.y,
        z: node.positionMm.z + local.z,
      };
      min.x = Math.min(min.x, center.x - halfX);
      min.y = Math.min(min.y, center.y - height / 2);
      min.z = Math.min(min.z, center.z - halfZ);
      max.x = Math.max(max.x, center.x + halfX);
      max.y = Math.max(max.y, center.y + height / 2);
      max.z = Math.max(max.z, center.z + halfZ);
    }
  }
  if (!Number.isFinite(min.x)) {
    min.x = min.y = min.z = 0;
    max.x = max.y = max.z = 0;
  }
  return {
    min,
    max,
    center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
    size: { widthMm: max.x - min.x, heightMm: max.y - min.y, depthMm: max.z - min.z },
  };
}
