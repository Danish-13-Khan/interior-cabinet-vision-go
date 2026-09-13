import type { OptionalBoqLine } from "../boq/optionalPacks";
import type { InteriorEstimateLine } from "./measure";
import { rateCategoryLabel } from "./categories";

export type SurfaceChargeConflict = {
  /** Geometry-derived category the extra charge overlaps. */
  category: string;
  kind: "manual" | "optional-pack";
  message: string;
  /** Estimate line ids or optional pack keys involved, so a caller can highlight them. */
  lineIds: string[];
};

const SURFACE_CATEGORIES = [
  "surface.floor", "surface.ceiling", "surface.wall",
  "surface.wall.wallpaper", "surface.wall.tile", "surface.tile",
] as const;

/** Words that mean a manual line is pricing a surface the geometry already measured. */
const SURFACE_WORDS: Record<string, readonly string[]> = {
  "surface.floor": ["floor", "flooring", "tile", "vitrified", "laminate floor"],
  "surface.ceiling": ["ceiling", "false ceiling", "pop"],
  "surface.wall": ["wall", "paint", "wallpaper", "putty", "texture"],
};

const OPTIONAL_SKU_CATEGORY: Record<string, string> = {
  "finish.flooring": "surface.floor",
  "finish.paint.wall": "surface.wall",
  "finish.wallpaper": "surface.wall",
};

function includedSurfaceLines(lines: readonly InteriorEstimateLine[], category: string) {
  return lines.filter((line) => line.category === category && !line.excluded);
}

/**
 * Flag charges that price a surface the geometry already measured. This does not
 * delete anything: a designer may legitimately quote a second coat or a patch, so
 * the caller shows the conflict and the user excludes one side deliberately.
 */
export function reconcileSurfaceCharges(
  lines: readonly InteriorEstimateLine[],
  optionalLines: readonly OptionalBoqLine[] = [],
): SurfaceChargeConflict[] {
  const conflicts: SurfaceChargeConflict[] = [];
  for (const category of SURFACE_CATEGORIES) {
    const measured = includedSurfaceLines(lines, category);
    if (measured.length === 0) continue;
    const label = rateCategoryLabel(category);

    const manual = lines.filter((line) => line.category === "manual" && !line.excluded
      && line.unit === "m2"
      && SURFACE_WORDS[category].some((word) => line.label.toLowerCase().includes(word)));
    if (manual.length > 0) {
      conflicts.push({
        category,
        kind: "manual",
        message: `${label} is already measured from the room geometry (${measured.length} ${measured.length === 1 ? "line" : "lines"}). `
          + `${manual.length} custom m² ${manual.length === 1 ? "line" : "lines"} appear to charge for it again.`,
        lineIds: manual.map((line) => line.id),
      });
    }

    const optional = optionalLines.filter((line) => OPTIONAL_SKU_CATEGORY[line.skuId] === category);
    if (optional.length > 0) {
      conflicts.push({
        category,
        kind: "optional-pack",
        message: `${label} is already measured from the room geometry. `
          + `Optional pack ${optional.map((line) => line.label).join(", ")} charges the same surface.`,
        lineIds: optional.map((line) => line.key),
      });
    }
  }
  return conflicts;
}
