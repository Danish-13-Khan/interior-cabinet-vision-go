/** Which side of an axis stays put when a size changes (roadmap §4.2). */
export type ResizeAnchor = "min" | "centre" | "max";
export type ResizeAnchors = { x?: ResizeAnchor; z?: ResizeAnchor };

/**
 * New extent along one axis: "min" keeps the low edge and moves the high one,
 * "max" keeps the high edge, "centre" grows or shrinks about the middle.
 */
export function resizeAlongAxis(
  minMm: number,
  maxMm: number,
  nextSizeMm: number,
  anchor: ResizeAnchor = "centre",
): { minMm: number; maxMm: number } {
  if (anchor === "min") return { minMm, maxMm: minMm + nextSizeMm };
  if (anchor === "max") return { minMm: maxMm - nextSizeMm, maxMm };
  const centre = (minMm + maxMm) / 2;
  return { minMm: centre - nextSizeMm / 2, maxMm: centre + nextSizeMm / 2 };
}

/** Dragging the high edge keeps the low one, and the other way round; Alt resizes about the centre. */
export function anchorForDraggedEdge(edge: "min" | "max", symmetric = false): ResizeAnchor {
  if (symmetric) return "centre";
  return edge === "max" ? "min" : "max";
}
