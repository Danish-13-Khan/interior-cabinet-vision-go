import { SCALE } from "../technicalViews/constants";
import { line, rect, text } from "../technicalViews/svgPrimitives";

/** Zoomed detail callout bubble + leader pointing at a region. */
export function detailCalloutBubble(
  cx: number,
  cy: number,
  label: string,
  sheetRef: string,
  leaderTo?: { x: number; y: number },
) {
  const elements: string[] = [];
  const r = 9;
  elements.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" class="twod-detail-bubble" />`,
    text(
      cx,
      cy + 3,
      label,
      `class="twod-detail-bubble-text" font-size="7" text-anchor="middle"`,
    ),
    text(
      cx + r + 4,
      cy + 3,
      sheetRef,
      `class="twod-detail-ref" font-size="6" text-anchor="start"`,
    ),
  );
  if (leaderTo) {
    elements.push(
      line(
        cx,
        cy + r,
        leaderTo.x,
        leaderTo.y,
        `class="twod-detail-leader" pointer-events="none"`,
      ),
    );
  }
  return elements;
}

/** Rectangular zoom frame around a cabinet region. */
export function detailZoomFrame(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  return [
    rect(
      x - 3,
      y - 3,
      width + 6,
      height + 6,
      `class="twod-detail-frame" pointer-events="none"`,
    ),
    text(
      x + width + 6,
      y + 8,
      label,
      `class="twod-detail-ref" font-size="6.5" text-anchor="start"`,
    ),
  ];
}

export function detailScaleLabel(detailScale: number) {
  return `1:${Math.round((SCALE * 25) / detailScale)}`;
}
