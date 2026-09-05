/**
 * Self-contained plan presentation CSS for SVG→PNG/PDF export.
 * Hand-curated subset of living-room-plan.css / interiors-product.css so
 * rasterization does not depend on external stylesheets.
 */
export const PLAN_EXPORT_STYLESHEET = `
.lr-plan-svg, .lr-plan-sheet-drawing {
  background: #ffffff;
}
.lr-plan-paper {
  fill: #f7f8f9;
}
.lr-grid-line {
  fill: none;
  stroke: #cfd6dc;
  stroke-width: 4;
}
.lr-grid-major-line {
  fill: none;
  stroke: #aebbc6;
  stroke-width: 7;
}
.lr-center-line {
  stroke: #8f7b66;
  stroke-width: 8;
  stroke-dasharray: 70 35 15 35;
}
.lr-wall-line {
  stroke: #14202b;
  stroke-width: 120;
  stroke-linecap: square;
}
.lr-opening line {
  stroke: #f7f8f9;
  stroke-width: 145;
}
.lr-opening-door line,
.lr-opening-door .lr-opening-leaf {
  stroke: #d4a017;
  stroke-width: 28;
}
.lr-opening-door .lr-opening-clear {
  stroke: #f7f8f9;
  stroke-width: 155;
}
.lr-opening-window line,
.lr-opening-window .lr-opening-symbol-detail {
  stroke: #2f86a8;
  stroke-width: 28;
}
.lr-opening-window .lr-opening-clear {
  stroke: #d7eef6;
  stroke-width: 120;
}
.lr-opening-swing-arc {
  stroke: #c7921f;
  stroke-width: 18;
  stroke-dasharray: 40 28;
  fill: none;
}
.lr-opening-glass-hatch {
  stroke: #2f86a8;
  stroke-width: 16;
  stroke-dasharray: 24 18;
}
.lr-opening-symbol-detail {
  stroke-width: 28px !important;
  opacity: 0.8;
  pointer-events: none;
}
.lr-opening text,
.lr-opening-width-label,
.lr-opening-offset-label {
  fill: #2a4458;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 105px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 14px;
  pointer-events: none;
}
.lr-opening-offset-label {
  font-size: 92px;
  fill: #4a6578;
}
.lr-plan-object > rect:first-of-type {
  fill: #d8c3a1;
  stroke: #3a4650;
  stroke-width: 14;
  vector-effect: non-scaling-stroke;
}
.lr-plan-object:nth-of-type(3n) > rect:first-of-type {
  fill: #b9c7b0;
}
.lr-plan-object.is-footprint-base > rect:first-of-type {
  fill: #d7c2a0;
  stroke: #3a4650;
  stroke-width: 16;
}
.lr-plan-object.is-footprint-wall > rect:first-of-type {
  fill: rgba(180, 198, 214, 0.55);
  stroke: #4a6578;
  stroke-dasharray: 36 22;
  stroke-width: 16;
}
.lr-plan-object.is-footprint-tall > rect:first-of-type {
  fill: #c9b7a0;
  stroke: #2f3b45;
  stroke-width: 22;
}
.lr-plan-object.is-footprint-appliance > rect:first-of-type {
  fill: #dfe4e8;
  stroke: #1f2a33;
  stroke-width: 26;
}
.lr-plan-object.is-footprint-filler > rect:first-of-type,
.lr-filler-symbol rect {
  fill: rgba(120, 130, 140, 0.35);
  stroke: #5a6570;
  stroke-width: 14;
  stroke-dasharray: 22 14;
}
.lr-filler-symbol line {
  stroke: #5a6570;
  stroke-width: 16;
}
.lr-cabinet-counter-edge {
  stroke: #6b4f2c;
  stroke-width: 22;
}
.lr-cabinet-mark {
  fill: #38546a;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 120px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
}
.lr-object-axis {
  stroke: #6c7378;
  stroke-width: 10;
}
.lr-object-label {
  fill: #182531;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 105px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
}
.lr-object-size {
  fill: #536271;
  font-size: 82px;
  font-weight: 500;
}
.lr-plan-mark {
  font-weight: 800;
  fill: #0b3d5c;
}
.lr-overall-dim line {
  stroke: #32485b;
  stroke-width: 8;
}
.lr-overall-dim text {
  fill: #24394b;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 115px;
  font-weight: 700;
  text-anchor: middle;
}
.lr-plan-dimension-pairs line,
.is-driving-dim line,
.lr-wall-length-labels line,
.lr-wall-length-editable line {
  stroke: #32485b;
  stroke-width: 8;
  fill: none;
}
.lr-plan-dimension-pairs text,
.is-driving-dim text,
.lr-wall-length-labels text,
.lr-wall-length-editable text {
  fill: #24394b;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 115px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(255,255,255,0.9);
  stroke-width: 14px;
}
.lr-reference-dimensions line,
.lr-reference-dim line,
.is-reference-dim line {
  stroke: #6a8294;
  stroke-width: 6;
  fill: none;
  stroke-dasharray: 40 28;
}
.lr-reference-dimensions text,
.lr-reference-dim text,
.is-reference-dim text {
  fill: #4d6575;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 95px;
  font-weight: 600;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(255,255,255,0.9);
  stroke-width: 12px;
}
.lr-plan-symbol,
.lr-plan-symbol * {
  fill: rgba(173, 181, 189, 0.22);
  stroke: #68727c;
  stroke-width: 8;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}
.lr-plan-underlay-image {
  pointer-events: none;
  opacity: 0.55;
}
.lr-plan-svg.is-print-export .lr-snap-guide-group,
.lr-plan-svg.is-print-export .lr-free-wall-segments,
.lr-plan-svg.is-print-export .lr-plan-marquee,
.lr-plan-svg.is-print-export .lr-resize-handle,
.lr-plan-svg.is-print-export .lr-opening-width-handle,
.lr-plan-svg.is-print-export .lr-object-warning,
.lr-plan-svg.is-print-export .lr-measure-overlay,
.lr-plan-svg.is-print-export foreignObject,
.lr-plan-svg.is-print-export .is-selected .lr-resize-handle {
  display: none !important;
}
.lr-plan-svg.is-print-export[data-print-furniture="false"] .lr-plan-object[data-print-role="furniture"] { display: none !important; }
.lr-plan-svg.is-print-export[data-print-cabinets="false"] .lr-plan-object[data-print-role="cabinet"] { display: none !important; }
.lr-plan-svg.is-print-export[data-print-openings="false"] .lr-plan-openings-layer { display: none !important; }
.lr-plan-svg.is-print-export[data-print-dims="false"] .lr-plan-dimension-pairs,
.lr-plan-svg.is-print-export[data-print-dims="false"] .lr-wall-length-labels { display: none !important; }
.lr-plan-svg.is-print-export[data-print-reference-dims="false"] .lr-reference-dimensions { display: none !important; }
.lr-plan-svg.is-print-export[data-print-marks="false"] .lr-plan-mark { display: none !important; }
.lr-plan-svg.is-print-export[data-print-labels="false"] .lr-object-label { display: none !important; }
.lr-plan-svg.is-print-export[data-print-grid="false"] .lr-plan-grid { display: none !important; }
.lr-plan-svg.is-print-export[data-print-underlay="false"] .lr-plan-underlay-image { display: none !important; }
.lr-plan-scale-bar text,
.lr-plan-sales-title text,
.lr-plan-technical-title text {
  font-family: system-ui, sans-serif;
}
`.trim();

const STYLE_MARKER = "lr-plan-export-styles";

/** Insert a self-contained `<style>` as the first child of the root `<svg>`. */
export function injectExportStyles(svg: string): string {
  if (!svg) return svg;
  // Only skip when the *root* svg already has the export stylesheet as its first child.
  // Nested plan SVGs may already contain the marker; the sheet still needs its own copy.
  if (/<svg\b[^>]*>\s*<style[^>]*class="lr-plan-export-styles"/i.test(svg)) return svg;
  const styleBlock =
    `<style class="${STYLE_MARKER}" type="text/css"><![CDATA[\n${PLAN_EXPORT_STYLESHEET}\n]]></style>`;
  if (/<svg\b[^>]*>/i.test(svg)) {
    return svg.replace(/<svg\b[^>]*>/i, (openTag) => `${openTag}${styleBlock}`);
  }
  return `${styleBlock}${svg}`;
}
