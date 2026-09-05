import type { InteriorObjectEntity } from "../interiorProject";

export type PlanObjectLabelMode = "full" | "name" | "hidden";

export type PlanObjectLabelInput = Pick<
  InteriorObjectEntity,
  "id" | "name" | "category" | "kind" | "position" | "dimensions" | "rotation"
>;

function approxLabelWidthMm(name: string, compact: boolean) {
  const chars = Math.max(4, Math.min(name.length, 22));
  return chars * (compact ? 48 : 62);
}

function centersClose(
  a: PlanObjectLabelInput,
  b: PlanObjectLabelInput,
  padMm: number,
) {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  const dist = Math.hypot(dx, dz);
  const span = (a.dimensions.widthMm + b.dimensions.widthMm) / 2
    + Math.max(approxLabelWidthMm(a.name, true), approxLabelWidthMm(b.name, true)) * 0.35
    + padMm;
  return dist < span;
}

/**
 * CAB-046: pick label density at default/fit zoom so packed runs stay readable.
 * Selected objects keep name (+ size when roomy); dense neighbors hide non-selected labels.
 */
export function resolvePlanObjectLabelModes(
  objects: PlanObjectLabelInput[],
  selectedIds: string[],
): Map<string, PlanObjectLabelMode> {
  const selected = new Set(selectedIds);
  const visible = objects.filter((object) => object.category !== "rug");
  const modes = new Map<string, PlanObjectLabelMode>();

  for (const object of objects) {
    if (object.category === "rug") {
      modes.set(object.id, "hidden");
      continue;
    }
    const isSelected = selected.has(object.id);
    const compact = object.dimensions.widthMm < 700 || object.dimensions.depthMm < 200;
    const isFiller = object.category === "filler";

    if (isFiller && !isSelected) {
      modes.set(object.id, "hidden");
      continue;
    }

    const crowded = visible.some((other) =>
      other.id !== object.id && centersClose(object, other, isSelected ? 80 : 160));

    if (isSelected) {
      modes.set(object.id, compact || crowded ? "name" : "full");
      continue;
    }

    if (crowded) {
      modes.set(object.id, "hidden");
      continue;
    }

    modes.set(object.id, compact ? "name" : "full");
  }

  return modes;
}
