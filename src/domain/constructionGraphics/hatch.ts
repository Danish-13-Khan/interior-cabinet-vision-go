import {
  HATCH_FILLER_STEP,
  HATCH_MATERIAL_STEP,
  HATCH_SECTION_STEP,
} from "../technicalLineSystem";
import { line, rect } from "./svg";

export type HatchKind = "section" | "filler" | "material";

const HATCH_CLASS: Record<HatchKind, string> = {
  section: "twod-section-hatch",
  filler: "twod-filler-hatch twod-line-interior",
  material: "twod-material-hatch twod-line-interior",
};

const HATCH_STEP: Record<HatchKind, number> = {
  section: HATCH_SECTION_STEP,
  filler: HATCH_FILLER_STEP,
  material: HATCH_MATERIAL_STEP,
};

/** Shared SVG pattern defs for drafting fills (per-sheet). */
export function draftingHatchDefs(): string {
  return `<defs class="twod-hatch-defs">
  <pattern id="hatch-section" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="5" class="twod-hatch-stroke twod-hatch-section-stroke" />
  </pattern>
  <pattern id="hatch-filler" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-45)">
    <line x1="0" y1="0" x2="0" y2="4" class="twod-hatch-stroke twod-hatch-filler-stroke" />
  </pattern>
  <pattern id="hatch-material" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="6" class="twod-hatch-stroke twod-hatch-material-stroke" />
  </pattern>
</defs>`;
}

/**
 * Procedural 45° hatch clipped to a rectangle (print-safe, no pattern URL needed).
 */
export function hatchFill(
  x: number,
  y: number,
  w: number,
  h: number,
  kind: HatchKind = "section",
  boardClass = "twod-section-board",
): string[] {
  const elements: string[] = [];
  const step = HATCH_STEP[kind];
  const hatchClass = HATCH_CLASS[kind];
  elements.push(rect(x, y, w, h, `class="${boardClass}" pointer-events="none"`));
  const max = w + h;
  for (let d = -h; d < max; d += step) {
    const x1 = x + Math.max(0, d);
    const y1 = y + Math.max(0, -d);
    const x2 = x + Math.min(w, d + h);
    const y2 = y + Math.min(h, w - d);
    if (x2 > x1 && y2 > y1) {
      elements.push(
        line(x1, y1, x2, y2, `class="${hatchClass}" pointer-events="none"`),
      );
    }
  }
  return elements;
}

/** Pattern-backed fill rect for fillers / material bands. */
export function patternFillRect(
  x: number,
  y: number,
  w: number,
  h: number,
  kind: HatchKind,
  extraClass = "",
): string {
  const pattern =
    kind === "section"
      ? "hatch-section"
      : kind === "filler"
        ? "hatch-filler"
        : "hatch-material";
  const cls = ["twod-hatch-fill", `twod-hatch-fill-${kind}`, extraClass]
    .filter(Boolean)
    .join(" ");
  return rect(
    x,
    y,
    w,
    h,
    `class="${cls}" fill="url(#${pattern})" pointer-events="none"`,
  );
}
