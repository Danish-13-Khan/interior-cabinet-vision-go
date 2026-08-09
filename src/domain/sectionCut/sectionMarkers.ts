import { SCALE } from "../technicalViews/constants";
import { line, text } from "../technicalViews/svgPrimitives";
import { renderSectionBubble } from "../draftingSymbols";
import type { SectionCutPlane } from "./cutPlane";

function arrowHead(
  tipX: number,
  tipY: number,
  dir: "left" | "right" | "up" | "down",
  size = 5,
) {
  if (dir === "right") {
    return [
      line(tipX, tipY, tipX - size, tipY - size * 0.55, `class="twod-section-marker"`),
      line(tipX, tipY, tipX - size, tipY + size * 0.55, `class="twod-section-marker"`),
    ];
  }
  if (dir === "left") {
    return [
      line(tipX, tipY, tipX + size, tipY - size * 0.55, `class="twod-section-marker"`),
      line(tipX, tipY, tipX + size, tipY + size * 0.55, `class="twod-section-marker"`),
    ];
  }
  if (dir === "up") {
    return [
      line(tipX, tipY, tipX - size * 0.55, tipY + size, `class="twod-section-marker"`),
      line(tipX, tipY, tipX + size * 0.55, tipY + size, `class="twod-section-marker"`),
    ];
  }
  return [
    line(tipX, tipY, tipX - size * 0.55, tipY - size, `class="twod-section-marker"`),
    line(tipX, tipY, tipX + size * 0.55, tipY - size, `class="twod-section-marker"`),
  ];
}

/** Plan: cut line across depth with circle section bubbles looking toward cut. */
export function planSectionMarkers(
  plane: SectionCutPlane,
  ox: number,
  oy: number,
  roomDepthMm: number,
) {
  const x = ox + plane.xMm / SCALE;
  const top = oy - roomDepthMm / SCALE / 2;
  const bottom = oy + roomDepthMm / SCALE / 2;
  const look = plane.looking === "right" ? 1 : -1;
  return [
    line(x, top, x, bottom, `class="twod-section-marker twod-section-cut-line"`),
    ...arrowHead(x + look * 7, top + 10, plane.looking),
    ...arrowHead(x + look * 7, bottom - 10, plane.looking),
    ...renderSectionBubble(x + look * 14, top + 10, plane.mark),
    ...renderSectionBubble(x + look * 14, bottom - 10, plane.mark),
    text(
      x + look * 24,
      (top + bottom) / 2,
      plane.label,
      `class="twod-section-mark-label" font-size="6" text-anchor="${plane.looking === "right" ? "start" : "end"}"`,
    ),
  ];
}

/** Front elevation: vertical cut marker with section bubbles. */
export function elevationSectionMarkers(
  plane: SectionCutPlane,
  ox: number,
  oy: number,
  roomHeightMm: number,
) {
  const x = ox + plane.xMm / SCALE;
  const top = oy - roomHeightMm / SCALE / 2;
  const bottom = oy + roomHeightMm / SCALE / 2;
  return [
    line(x, top, x, bottom, `class="twod-section-marker twod-section-cut-line"`),
    ...arrowHead(x, top + 2, "down", 4),
    ...arrowHead(x, bottom - 2, "up", 4),
    ...renderSectionBubble(x + 12, top + 10, plane.mark),
    ...renderSectionBubble(x + 12, bottom - 10, plane.mark),
  ];
}
