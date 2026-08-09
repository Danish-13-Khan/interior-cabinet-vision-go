import { circle, line, text } from "../technicalViews/svgPrimitives";

/** Classic circle-with-letter section bubble used on plans and elevations. */
export function renderSectionBubble(
  cx: number,
  cy: number,
  mark: string,
  radius = 7,
): string[] {
  return [
    circle(cx, cy, radius, `class="twod-section-bubble"`),
    line(
      cx - radius,
      cy,
      cx + radius,
      cy,
      `class="twod-section-bubble-rule"`,
    ),
    text(
      cx,
      cy - 1.5,
      mark,
      `class="twod-section-bubble-text" font-size="6.5" font-weight="700" text-anchor="middle"`,
    ),
  ];
}

/** Elevation mark triangle + cabinet code (shop elev tag). */
export function renderElevationMark(
  x: number,
  y: number,
  mark: string,
): string[] {
  const w = Math.max(22, mark.length * 5.5 + 8);
  return [
    `<polygon points="${x},${y - 9} ${x - w / 2},${y + 2} ${x + w / 2},${y + 2}" class="twod-elev-mark" />`,
    text(
      x,
      y - 0.5,
      mark,
      `class="twod-elev-mark-text" font-size="6.5" font-weight="700" text-anchor="middle"`,
    ),
  ];
}

/** Filler / end-panel mark for run drawings. */
export function renderFillerMark(
  x: number,
  y: number,
  mark: string,
  widthMmLabel?: string,
): string[] {
  const label = widthMmLabel ? `${mark} ${widthMmLabel}` : mark;
  const w = Math.max(28, label.length * 5 + 8);
  return [
    `<rect x="${x - w / 2}" y="${y - 7}" width="${w}" height="12" class="twod-filler-mark" />`,
    text(
      x,
      y + 2,
      label,
      `class="twod-filler-mark-text" font-size="6" font-weight="700" text-anchor="middle"`,
    ),
  ];
}

/** Compact run marker chip (R01). */
export function renderRunMarker(
  x: number,
  y: number,
  mark: string,
): string[] {
  const w = Math.max(24, mark.length * 6 + 8);
  return [
    `<rect x="${x - w / 2}" y="${y - 7}" width="${w}" height="12" rx="1" class="twod-run-marker" />`,
    text(
      x,
      y + 2,
      mark,
      `class="twod-run-marker-text" font-size="6.5" font-weight="700" text-anchor="middle"`,
    ),
  ];
}
