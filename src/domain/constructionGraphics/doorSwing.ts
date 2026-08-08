import type { DoorHinge, DoorStyle } from "../cabinetOpeningStructure";
import { path, quarterArcPath } from "./svg";

export function resolveDoorLeafCount(style: DoorStyle | undefined, widthMm: number) {
  if (style === "none") return 0;
  if (style === "single" || widthMm < 600) return 1;
  if (style === "bi-fold") return 4;
  return 2;
}

/** Handle sits opposite the hinge on a leaf. */
export function handleSideForLeaf(
  hinge: DoorHinge | undefined,
  leafIndex: number,
  leafCount: number,
): "left" | "right" {
  if (leafCount === 1) {
    if (hinge === "right") return "left";
    return "right";
  }
  if (leafCount === 2) {
    return leafIndex === 0 ? "right" : "left";
  }
  // bi-fold: outer hinges, handles toward center folds
  return leafIndex < leafCount / 2 ? "right" : "left";
}

export function hingeSideForLeaf(
  hinge: DoorHinge | undefined,
  leafIndex: number,
  leafCount: number,
): "left" | "right" {
  if (leafCount === 1) {
    return hinge === "right" ? "right" : "left";
  }
  if (leafCount === 2) {
    return leafIndex === 0 ? "left" : "right";
  }
  return leafIndex < leafCount / 2 ? "left" : "right";
}

/**
 * Elevation swing arc for a door leaf (quarter circle into the room).
 * Hinge at leaf edge; arc sweeps toward open position.
 */
export function elevDoorSwingArc(
  leafX: number,
  leafY: number,
  leafW: number,
  leafH: number,
  hingeSide: "left" | "right",
): string {
  const hingeX = hingeSide === "left" ? leafX : leafX + leafW;
  const hingeY = leafY + leafH;
  const tipX = hingeSide === "left" ? leafX + leafW : leafX;
  const openX = hingeSide === "left" ? hingeX + leafW * 0.15 : hingeX - leafW * 0.15;
  const openY = hingeY - leafW;
  const sweep = hingeSide === "left" ? 1 : 0;
  const d = quarterArcPath(hingeX, hingeY, tipX, hingeY, openX, Math.max(leafY, openY), sweep);
  return path(
    d,
    `class="twod-door-swing twod-line-hidden" fill="none" pointer-events="none"`,
  );
}

export function elevBifoldFolds(
  leafXs: number[],
  leafY: number,
  leafH: number,
): string[] {
  const elements: string[] = [];
  for (let i = 1; i < leafXs.length; i += 1) {
    const x = leafXs[i]!;
    elements.push(
      `<line x1="${x}" y1="${leafY}" x2="${x}" y2="${leafY + leafH}" class="twod-door-fold twod-line-reference" pointer-events="none" />`,
    );
  }
  return elements;
}
