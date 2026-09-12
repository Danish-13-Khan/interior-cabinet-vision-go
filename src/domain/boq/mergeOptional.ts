/**
 * Merge optional pack lines into BOQ views without a second quantity engine.
 * Optional lines map into BoqLine with role "other" and cabinetId "optional".
 */

import { buildBoqViews } from "./views";
import type { OptionalBoqLine } from "./optionalPacks";
import { OPTIONAL_PACK_KIND_LABELS } from "./optionalPacks";
import type { BoqGroup, BoqLine, BoqViews } from "./types";

export type BoqViewsWithOptional = BoqViews & {
  optionalLines: OptionalBoqLine[];
  byOptionalPack: BoqGroup[];
  optionalSellTotal: number;
  optionalWorkshopTotal: number;
};

function areaFromOptional(line: OptionalBoqLine): number {
  if (line.unit === "m2") return Number(line.quantity.toFixed(4));
  if (line.unit === "lm") return Number(line.quantity.toFixed(4));
  return 0;
}

/** Map an optional pack line onto the shared BoqLine shape. */
export function optionalLineToBoqLine(line: OptionalBoqLine): BoqLine {
  return {
    key: line.key,
    cabinetId: "optional",
    cabinetName: OPTIONAL_PACK_KIND_LABELS[line.packKind],
    mark: "",
    partLabel: line.label,
    category: line.category,
    role: "other",
    material: line.packKind,
    finish: line.unit,
    thicknessMm: 0,
    quantity: line.quantity,
    lengthMm: 0,
    widthMm: 0,
    areaM2: areaFromOptional(line),
    workshopCost: line.workshopCost,
    sellPrice: line.sellPrice,
  };
}

export function groupOptionalPackViews(lines: readonly OptionalBoqLine[]): BoqGroup[] {
  const kinds: Array<OptionalBoqLine["packKind"]> = ["louvers", "area_finish", "fixture"];
  return kinds
    .map((kind) => {
      const groupLines = lines
        .filter((line) => line.packKind === kind)
        .map(optionalLineToBoqLine);
      if (!groupLines.length) return null;
      return {
        key: `optional:${kind}`,
        title: OPTIONAL_PACK_KIND_LABELS[kind],
        lines: groupLines,
        totalQuantity: groupLines.reduce((sum, line) => sum + line.quantity, 0),
        totalAreaM2: Number(
          groupLines.reduce((sum, line) => sum + line.areaM2, 0).toFixed(3),
        ),
        workshopCost: groupLines.reduce((sum, line) => sum + line.workshopCost, 0),
        sellPrice: groupLines.reduce((sum, line) => sum + line.sellPrice, 0),
      } satisfies BoqGroup;
    })
    .filter((group): group is BoqGroup => Boolean(group));
}

/**
 * Append optional pack lines into BOQ views (rebuilds grouped views).
 * Core cutlist lines stay first; optional rows follow.
 */
export function mergeOptionalIntoBoqViews(
  views: BoqViews,
  optionalLines: readonly OptionalBoqLine[],
): BoqViewsWithOptional {
  const mapped = optionalLines.map(optionalLineToBoqLine);
  const mergedLines = [...views.lines, ...mapped];
  const rebuilt = buildBoqViews(mergedLines);
  return {
    ...rebuilt,
    optionalLines: [...optionalLines],
    byOptionalPack: groupOptionalPackViews(optionalLines),
    optionalSellTotal: optionalLines.reduce((sum, line) => sum + line.sellPrice, 0),
    optionalWorkshopTotal: optionalLines.reduce((sum, line) => sum + line.workshopCost, 0),
  };
}
