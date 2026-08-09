/**
 * Canonical technical line hierarchy for production-style drawings.
 * CSS classes consume these roles; emitters should prefer role classes
 * over ad-hoc strokes.
 */

export type TechnicalLineRole =
  | "outline"
  | "interior"
  | "hidden"
  | "phantom"
  | "cut"
  | "dimension"
  | "guide"
  | "center"
  | "reference";

export type TechnicalLineSpec = {
  role: TechnicalLineRole;
  cssClass: string;
  /** Nominal screen stroke width (px), non-scaling. */
  weightPx: number;
  /** CSS custom property name for stroke color. */
  colorToken: string;
  /** SVG stroke-dasharray, or null for solid. */
  dash: string | null;
  description: string;
};

export const TECHNICAL_LINE_SPECS: readonly TechnicalLineSpec[] = [
  {
    role: "outline",
    cssClass: "twod-line-outline",
    weightPx: 1.55,
    colorToken: "--draft-outline",
    dash: null,
    description: "Primary cabinet / opening outlines",
  },
  {
    role: "interior",
    cssClass: "twod-line-interior",
    weightPx: 0.7,
    colorToken: "--draft-interior",
    dash: null,
    description: "Shelves, partitions, carcass internals",
  },
  {
    role: "hidden",
    cssClass: "twod-line-hidden",
    weightPx: 0.7,
    colorToken: "--draft-hidden",
    dash: "3.5 2",
    description: "Hidden edges and swing arcs",
  },
  {
    role: "phantom",
    cssClass: "twod-line-phantom",
    weightPx: 0.85,
    colorToken: "--draft-phantom",
    dash: "6 2.5 1.5 2.5",
    description: "Overhead / phantom footprints",
  },
  {
    role: "cut",
    cssClass: "twod-line-cut",
    weightPx: 1.6,
    colorToken: "--draft-cut",
    dash: null,
    description: "Section cut planes and markers",
  },
  {
    role: "dimension",
    cssClass: "twod-line-dimension",
    weightPx: 1.05,
    colorToken: "--draft-dim",
    dash: null,
    description: "Dimension lines and extensions",
  },
  {
    role: "guide",
    cssClass: "twod-line-guide",
    weightPx: 0.9,
    colorToken: "--draft-guide",
    dash: "4 3",
    description: "Snap and construction guides",
  },
  {
    role: "center",
    cssClass: "twod-line-center",
    weightPx: 0.55,
    colorToken: "--draft-center",
    dash: "9 2.5 1.5 2.5",
    description: "Centerlines and mullions",
  },
  {
    role: "reference",
    cssClass: "twod-line-reference",
    weightPx: 0.65,
    colorToken: "--draft-reference",
    dash: "7 3",
    description: "Reference / hinge / reveal marks",
  },
] as const;

export const HATCH_SECTION_STEP = 2.8;
export const HATCH_FILLER_STEP = 3.2;
export const HATCH_MATERIAL_STEP = 4;

export function getLineSpec(role: TechnicalLineRole): TechnicalLineSpec {
  const spec = TECHNICAL_LINE_SPECS.find((item) => item.role === role);
  if (!spec) throw new Error(`Unknown line role: ${role}`);
  return spec;
}

export function lineRoleClass(role: TechnicalLineRole, extra = ""): string {
  return [getLineSpec(role).cssClass, extra].filter(Boolean).join(" ");
}

/** Heavier roles must outrank lighter ones for visual hierarchy. */
export function assertOutlineHeavierThanInterior(): boolean {
  return getLineSpec("outline").weightPx > getLineSpec("interior").weightPx;
}

export function assertCutHeavierThanHidden(): boolean {
  return getLineSpec("cut").weightPx > getLineSpec("hidden").weightPx;
}
