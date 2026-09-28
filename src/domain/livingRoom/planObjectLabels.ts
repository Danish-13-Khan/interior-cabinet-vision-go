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

/** True when footprints nearly stack (not merely adjacent in a run). */
function centresNearlyStacked(a: PlanObjectLabelInput, b: PlanObjectLabelInput) {
  const dist = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
  const minHalf = Math.min(a.dimensions.widthMm, b.dimensions.widthMm) * 0.35;
  return dist < Math.max(80, minHalf);
}

/**
 * CAB-046: pick label density at default/fit zoom so packed runs stay readable.
 * Selected objects keep name (+ size when roomy); dense non-selected cabinets prefer
 * compact name labels; hide only fillers / rugs / nearly-stacked duplicates.
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

    // Reduced pad (was 160 for non-selected) so adjacency prefers name over blank.
    const crowded = visible.some((other) =>
      other.id !== object.id && centersClose(object, other, isSelected ? 80 : 48));
    const veryCrowded = !isSelected && visible.some((other) =>
      other.id !== object.id
      && other.category !== "filler"
      && centresNearlyStacked(object, other));

    if (isSelected) {
      modes.set(object.id, compact || crowded ? "name" : "full");
      continue;
    }

    if (veryCrowded) {
      modes.set(object.id, "hidden");
      continue;
    }

    if (crowded || compact) {
      modes.set(object.id, "name");
      continue;
    }

    modes.set(object.id, "full");
  }

  return modes;
}

/** Footprints shallower than this put the label just in front instead of inside. */
export const PLAN_LABEL_INSIDE_MIN_DEPTH_MM = 300;

/**
 * Baselines (plan mm, label frame is world-aligned) for the name and size lines.
 * Labels stay inside the footprint so wall-backed cabinets never label the wall line.
 */
export function planObjectLabelBaselines(input: {
  widthMm: number;
  depthMm: number;
  rotationY: number;
  mode: PlanObjectLabelMode;
  selected: boolean;
}): { nameY: number; sizeY: number } {
  const twoLines = input.mode === "full" || input.selected;
  const radians = (input.rotationY * Math.PI) / 180;
  const halfY = Math.abs(Math.sin(radians)) * input.widthMm / 2 + Math.abs(Math.cos(radians)) * input.depthMm / 2;
  if (Math.min(input.widthMm, input.depthMm) < PLAN_LABEL_INSIDE_MIN_DEPTH_MM) {
    const nameY = halfY + 140;
    return { nameY, sizeY: nameY + 115 };
  }
  return twoLines ? { nameY: -20, sizeY: 100 } : { nameY: 45, sizeY: 160 };
}
