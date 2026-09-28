/**
 * Collision-free placement for reference-dimension labels on the 2D plan.
 * Cabinet tags (name + size) are fixed obstacles; reference labels slide along
 * their dimension line or stack above / below it, and hide when nothing fits.
 */

import type { InteriorProject } from "../interiorProject";
import { planLabelBox, type PlanLabelBox } from "./planLabelBoxes";
import {
  layoutPlanLabels,
  type PlacedPlanLabel,
  type PlanLabelAnchor,
  type PlanLabelLayoutOptions,
} from "./planLabelLayout";
import { resolvePlanObjectLabelModes } from "./planObjectLabels";
import type { ReferenceDimension } from "./referenceDimensions";

/** Must match `.lr-reference-dim text` and `.lr-object-label` font sizes. */
export const PLAN_REFERENCE_LABEL_FONT_MM = 95;
export const PLAN_OBJECT_LABEL_FONT_MM = 88;
export const PLAN_OBJECT_LABEL_COMPACT_FONT_MM = 68;
export const PLAN_REFERENCE_LABEL_MAX_VISIBLE = 8;

const ALONG_LINE = [0.5, 0.32, 0.68, 0.18, 0.82] as const;

function unionBoxes(a: PlanLabelBox, b: PlanLabelBox): PlanLabelBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minZ: Math.min(a.minZ, b.minZ),
    maxX: Math.max(a.maxX, b.maxX),
    maxZ: Math.max(a.maxZ, b.maxZ),
  };
}

/** Screen-aligned boxes of the cabinet / furniture tags `PlanObjectsLayer` draws. */
export function planObjectTagBoxes(
  project: InteriorProject,
  selectedIds: readonly string[] = [],
  roomId = project.activeRoomId,
): PlanLabelBox[] {
  const objects = project.objects
    .filter((object) => object.roomId === roomId && object.extensions?.layerVisible !== false);
  const modes = resolvePlanObjectLabelModes(objects, [...selectedIds]);
  const boxes: PlanLabelBox[] = [];
  for (const object of objects) {
    const mode = modes.get(object.id) ?? "hidden";
    if (mode === "hidden") continue;
    const { x, z } = object.position;
    const { widthMm, depthMm } = object.dimensions;
    const compact = widthMm < 700 || depthMm < 200;
    const selected = selectedIds.includes(object.id);
    const font = compact || mode === "name" ? PLAN_OBJECT_LABEL_COMPACT_FONT_MM : PLAN_OBJECT_LABEL_FONT_MM;
    const nameY = selected || mode === "full" ? (compact ? z - depthMm / 2 - 70 : z - 8) : z - depthMm / 2 - 55;
    const name = planLabelBox(x, nameY, object.name, font);
    boxes.push(mode === "full" ? unionBoxes(name, planLabelBox(x, z + 68, "0000 × 000", font)) : name);
  }
  return boxes;
}

function referenceAnchors(dim: ReferenceDimension, fontSizeMm: number): PlanLabelAnchor[] {
  const rowStep = fontSizeMm * 1.2;
  const offsets = [-30, 30 + fontSizeMm * 0.8, -30 - rowStep, 30 + fontSizeMm * 0.8 + rowStep];
  const anchors: PlanLabelAnchor[] = [];
  for (const offset of offsets) {
    for (const t of ALONG_LINE) {
      anchors.push({
        x: dim.a.x + (dim.b.x - dim.a.x) * t,
        z: dim.a.z + (dim.b.z - dim.a.z) * t + offset,
      });
    }
  }
  return anchors;
}

export function referenceDimensionLabel(dim: ReferenceDimension, format: (mm: number) => string): string {
  return `Ref ${format(dim.lengthMm)}`;
}

/** Placed reference labels, in the same order as `dims`. */
export function layoutReferenceDimensionLabels(
  project: InteriorProject,
  dims: readonly ReferenceDimension[],
  format: (mm: number) => string,
  options: PlanLabelLayoutOptions & { selectedIds?: readonly string[] } = {},
): PlacedPlanLabel[] {
  const { selectedIds = [], ...layoutOptions } = options;
  const font = PLAN_REFERENCE_LABEL_FONT_MM;
  const requests = dims.map((dim) => ({
    id: dim.id,
    text: referenceDimensionLabel(dim, format),
    fontSizeMm: font,
    priority: dim.kind === "cabinet-to-opening" ? 2 : 1,
    candidates: referenceAnchors(dim, font),
  }));
  return layoutPlanLabels(requests, planObjectTagBoxes(project, selectedIds), {
    maxVisible: PLAN_REFERENCE_LABEL_MAX_VISIBLE,
    ...layoutOptions,
  });
}
