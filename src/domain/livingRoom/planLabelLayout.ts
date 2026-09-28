/**
 * Greedy 2D plan label placement: highest priority first, each label takes the
 * first candidate anchor whose box is clear of obstacles and placed labels.
 * Labels with no clear candidate (or unreadable at the current zoom) are hidden.
 */

import {
  padPlanLabelBox,
  planLabelBox,
  planLabelBoxesOverlap,
  type PlanLabelBox,
} from "./planLabelBoxes";

export type PlanLabelAnchor = { x: number; z: number };

export type PlanLabelRequest = {
  id: string;
  text: string;
  fontSizeMm: number;
  /** Higher places first and survives low zoom. */
  priority: number;
  /** Preferred anchors, best first. */
  candidates: readonly PlanLabelAnchor[];
};

export type PlacedPlanLabel = {
  id: string;
  text: string;
  x: number;
  z: number;
  box: PlanLabelBox;
  hidden: boolean;
};

export type PlanLabelLayoutOptions = {
  /** Clear gap kept around every label, in plan mm. */
  padMm?: number;
  maxVisible?: number;
  /** Screen scale; when set, low-priority labels below `minReadablePx` hide. */
  pxPerMm?: number;
  minReadablePx?: number;
  /** Labels at or above this priority ignore the low-zoom rule. */
  keepPriority?: number;
};

export function layoutPlanLabels(
  requests: readonly PlanLabelRequest[],
  obstacles: readonly PlanLabelBox[] = [],
  options: PlanLabelLayoutOptions = {},
): PlacedPlanLabel[] {
  const halfPad = (options.padMm ?? 24) / 2;
  const maxVisible = options.maxVisible ?? Number.POSITIVE_INFINITY;
  const minPx = options.minReadablePx ?? 8;
  const keepPriority = options.keepPriority ?? 2;
  const taken = obstacles.map((box) => padPlanLabelBox(box, halfPad));
  const placed = new Map<string, PlacedPlanLabel>();
  let visible = 0;

  const order = requests
    .map((request, index) => ({ request, index }))
    .sort((a, b) => b.request.priority - a.request.priority || a.index - b.index);

  for (const { request } of order) {
    const first = request.candidates[0] ?? { x: 0, z: 0 };
    const hiddenLabel: PlacedPlanLabel = {
      id: request.id,
      text: request.text,
      x: first.x,
      z: first.z,
      box: planLabelBox(first.x, first.z, request.text, request.fontSizeMm),
      hidden: true,
    };
    const tooSmall = options.pxPerMm !== undefined
      && request.priority < keepPriority
      && request.fontSizeMm * options.pxPerMm < minPx;
    if (tooSmall || visible >= maxVisible) {
      placed.set(request.id, hiddenLabel);
      continue;
    }
    let result = hiddenLabel;
    for (const anchor of request.candidates) {
      const box = planLabelBox(anchor.x, anchor.z, request.text, request.fontSizeMm);
      const padded = padPlanLabelBox(box, halfPad);
      if (taken.some((other) => planLabelBoxesOverlap(padded, other))) continue;
      taken.push(padded);
      result = { ...hiddenLabel, x: anchor.x, z: anchor.z, box, hidden: false };
      visible += 1;
      break;
    }
    placed.set(request.id, result);
  }

  return requests.map((request) => placed.get(request.id)!);
}
