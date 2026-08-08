import type { CabinetConfig } from "../cabinetDimensions";
import { describeOpeningStructure } from "../cabinetOpeningStructure";
import type { CabinetComposition, CabinetFillerSpec } from "./types";
import { createDefaultComposition, normalizeComposition } from "./normalize";

export function resolveCabinetComposition(config: CabinetConfig): CabinetComposition {
  const seed = config.composition
    ? config.composition
    : createDefaultComposition(config.type, config);
  return normalizeComposition(
    config.type,
    {
      ...createDefaultComposition(config.type, config),
      ...seed,
      openings: seed.openings ?? [],
    },
    config.dimensions.width,
  );
}

export function syncFlatFieldsFromComposition(
  composition: CabinetComposition,
): Pick<
  CabinetConfig,
  | "shelfCount"
  | "hasDoors"
  | "drawerCount"
  | "toeKickHeight"
  | "toeKickInset"
  | "leftEndPanel"
  | "rightEndPanel"
> {
  return {
    shelfCount: composition.shelves.count,
    hasDoors: composition.doors.enabled && composition.doors.style !== "none",
    drawerCount: composition.drawers.count,
    toeKickHeight: composition.toeKick.enabled ? composition.toeKick.heightMm : 0,
    toeKickInset: composition.toeKick.enabled ? composition.toeKick.insetMm : 0,
    leftEndPanel: composition.endPanels.left,
    rightEndPanel: composition.endPanels.right,
  };
}

export function getResolvedDoorCount(config: CabinetConfig): number {
  const composition = resolveCabinetComposition(config);
  return composition.doors.count;
}

export function getResolvedDividerCount(config: CabinetConfig): number {
  return resolveCabinetComposition(config).dividers.count;
}

export function getResolvedFillers(config: CabinetConfig): CabinetFillerSpec {
  return resolveCabinetComposition(config).fillers;
}

export function describeComposition(composition: CabinetComposition): string {
  const parts: string[] = [];
  if (composition.openingStructure) {
    parts.push(describeOpeningStructure(composition.openingStructure));
  } else if (composition.openings[0]) {
    parts.push(`${composition.openings[0].label} (${composition.openings[0].style})`);
  }
  if (composition.shelves.count > 0) {
    parts.push(
      `${composition.shelves.count} shelf${composition.shelves.count === 1 ? "" : "ves"}${composition.shelves.adjustable ? " adj." : ""}`,
    );
  }
  if (composition.dividers.count > 0) {
    parts.push(`${composition.dividers.count} divider${composition.dividers.count === 1 ? "" : "s"}`);
  }
  if (composition.doors.enabled && composition.doors.style !== "none") {
    parts.push(`${composition.doors.count}× ${composition.doors.style} door`);
  }
  if (composition.drawers.count > 0) {
    parts.push(`${composition.drawers.count} drawer${composition.drawers.count === 1 ? "" : "s"}`);
  }
  if (composition.toeKick.enabled) {
    parts.push(`toe kick ${composition.toeKick.heightMm}mm`);
  }
  if (composition.fillers.leftMm > 0 || composition.fillers.rightMm > 0) {
    parts.push(`fillers L${composition.fillers.leftMm}/R${composition.fillers.rightMm}`);
  }
  if (composition.endPanels.left || composition.endPanels.right) {
    parts.push(
      `ends ${[composition.endPanels.left ? "L" : "", composition.endPanels.right ? "R" : ""].join("")}`,
    );
  }
  return parts.join(" · ") || "Empty carcass";
}
