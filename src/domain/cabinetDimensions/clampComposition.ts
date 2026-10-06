import { createDefaultComposition, resolveCabinetComposition } from "../cabinetComposition";
import { getMinDividersForShelfSpan } from "../manufacturingRules";
import type { CabinetConfig, CabinetDimensions } from "./types";

export type ClampedCounts = {
  safeDimensions: CabinetDimensions;
  shelfCount: number;
  hasDoorsFlag: boolean;
  drawerCount: number;
  toeKickHeight: number;
  toeKickInset: number;
};

/** Composition for `clampCabinetConfig`: flat counts, door style, toe kick, end panels and span dividers. */
export function clampedComposition(merged: CabinetConfig, counts: ClampedCounts) {
  const { safeDimensions, shelfCount, hasDoorsFlag, drawerCount, toeKickHeight, toeKickInset } = counts;
  const seedComposition =
    merged.composition ??
    createDefaultComposition(merged.type, {
      ...merged,
      dimensions: safeDimensions,
      shelfCount,
      hasDoors: hasDoorsFlag,
      drawerCount,
      toeKickHeight,
      toeKickInset,
      leftEndPanel: Boolean(merged.leftEndPanel),
      rightEndPanel: Boolean(merged.rightEndPanel),
    });

  const composition = resolveCabinetComposition({
    ...merged,
    dimensions: safeDimensions,
    shelfCount,
    hasDoors: hasDoorsFlag,
    drawerCount,
    toeKickHeight,
    toeKickInset,
    leftEndPanel: Boolean(merged.leftEndPanel),
    rightEndPanel: Boolean(merged.rightEndPanel),
    composition: {
      ...seedComposition,
      shelves: {
        ...seedComposition.shelves,
        count: shelfCount,
      },
      drawers: {
        ...seedComposition.drawers,
        count: drawerCount,
      },
      doors: {
        ...seedComposition.doors,
        enabled: hasDoorsFlag,
        style: hasDoorsFlag
          ? seedComposition.doors.style === "none"
            ? safeDimensions.width < 600
              ? "single"
              : "double"
            : seedComposition.doors.style
          : "none",
      },
      toeKick: {
        ...seedComposition.toeKick,
        enabled: toeKickHeight > 0,
        heightMm: toeKickHeight,
        insetMm: toeKickInset,
      },
      endPanels: {
        left: Boolean(merged.leftEndPanel),
        right: Boolean(merged.rightEndPanel),
      },
      dividers: {
        ...seedComposition.dividers,
        count: Math.max(
          seedComposition.dividers.count,
          merged.composition?.dividers?.count ?? 0,
          getMinDividersForShelfSpan({
            ...merged,
            dimensions: safeDimensions,
            shelfCount,
            composition: seedComposition,
          }),
        ),
      },
    },
  });
  return composition;
}
