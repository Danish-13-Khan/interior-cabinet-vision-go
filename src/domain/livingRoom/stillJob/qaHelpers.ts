import type { Point2Mm, Point3Mm } from "../../interiorProject";
import type { StillJobGateResult } from "./types";

export function distance3(a: Point3Mm, b: Point3Mm) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function planDistance(a: Point3Mm, b: Point3Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function planVertexDistance(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function gate(
  id: StillJobGateResult["id"],
  pass: boolean,
  detail: string,
  measured?: number,
  limit?: number,
): StillJobGateResult {
  return { id, pass, detail, measured, limit };
}
