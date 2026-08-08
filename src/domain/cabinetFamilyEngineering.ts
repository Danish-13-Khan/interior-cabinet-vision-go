import type { CabinetType } from "./cabinetCapabilities";
import {
  supportsEndPanels,
  supportsToeKick,
} from "./cabinetCapabilities";
import {
  getCompositionCapabilities,
  supportsFillers,
  type CabinetEndPanelSpec,
  type CabinetFillerSpec,
  type CabinetToeKickSpec,
} from "./cabinetComposition";
import { getFamilyOpeningRules, type FamilyOpeningRules } from "./cabinetFamilyRules";

/** Explicit per-family engineering defaults for carcass openings and shell parts. */
export type FamilyEngineeringDefaults = {
  family: CabinetType;
  openings: FamilyOpeningRules;
  toeKick: CabinetToeKickSpec;
  fillers: CabinetFillerSpec;
  endPanels: CabinetEndPanelSpec;
  defaultDividerCount: number;
  notes: string;
};

export function getFamilyEngineeringDefaults(
  type: CabinetType,
): FamilyEngineeringDefaults {
  const openings = getFamilyOpeningRules(type);
  const caps = getCompositionCapabilities(type);

  const toeKick: CabinetToeKickSpec = {
    enabled: caps.toeKick && openings.defaultToeKick && supportsToeKick(type),
    heightMm: openings.defaultToeKick ? 100 : 0,
    insetMm: openings.defaultToeKick ? 50 : 0,
  };

  const fillers: CabinetFillerSpec = {
    leftMm: 0,
    rightMm: 0,
  };

  const endPanels: CabinetEndPanelSpec = {
    left: false,
    right: false,
  };

  // Tall / almirah often end-panel exposed runs; base/wall default no end panels
  if (caps.endPanels && supportsEndPanels(type) && (type === "tall" || type === "almirah")) {
    endPanels.left = false;
    endPanels.right = false;
  }

  void supportsFillers;

  return {
    family: type,
    openings,
    toeKick,
    fillers,
    endPanels,
    defaultDividerCount: type === "base" || type === "wall" ? 0 : 0,
    notes: [
      openings.notes,
      caps.toeKick ? "Toe kick engineering enabled." : "No toe kick.",
      caps.fillers ? "Carcass fillers available." : "No carcass fillers.",
      caps.endPanels ? "End panels available." : "No end panels.",
    ].join(" "),
  };
}

export function listFamilyEngineeringSummaries(): Array<{
  family: CabinetType;
  openings: string;
  toeKick: string;
  fillers: string;
  endPanels: string;
  notes: string;
}> {
  const families: CabinetType[] = [
    "base",
    "wall",
    "tall",
    "drawer",
    "sink",
    "corner",
    "open-shelf",
    "almirah",
    "table",
  ];
  return families.map((family) => {
    const engineering = getFamilyEngineeringDefaults(family);
    return {
      family,
      openings: engineering.openings.supportsOpenings
        ? `${engineering.openings.allowedContentTypes.join(", ")} · V:${engineering.openings.allowVerticalSplit ? "yes" : "no"} H:${engineering.openings.allowHorizontalSplit ? "yes" : "no"}`
        : "none",
      toeKick: engineering.toeKick.enabled
        ? `${engineering.toeKick.heightMm}×${engineering.toeKick.insetMm} mm`
        : "off",
      fillers: `L${engineering.fillers.leftMm}/R${engineering.fillers.rightMm}`,
      endPanels: `L:${engineering.endPanels.left ? "on" : "off"} R:${engineering.endPanels.right ? "on" : "off"}`,
      notes: engineering.notes,
    };
  });
}
