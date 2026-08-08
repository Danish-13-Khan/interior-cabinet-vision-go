import type {
  DoorHinge,
  DoorStyle,
  OpeningStructure,
  OpeningStyle,
} from "../cabinetOpeningStructure";

export type { DoorHinge, DoorStyle, OpeningStyle } from "../cabinetOpeningStructure";
export type {
  OpeningStructure,
  OpeningContentType,
  OpeningLeaf,
  OpeningNode,
  OpeningSplitAxis,
} from "../cabinetOpeningStructure";

export type CabinetOpening = {
  id: string;
  label: string;
  style: OpeningStyle;
};

export type CabinetShelfSpec = {
  count: number;
  adjustable: boolean;
};

export type CabinetDividerSpec = {
  count: number;
};

export type CabinetDoorSpec = {
  enabled: boolean;
  style: DoorStyle;
  hinge: DoorHinge;
  count: number;
};

export type CabinetDrawerSpec = {
  count: number;
  equalHeights: boolean;
};

export type CabinetToeKickSpec = {
  enabled: boolean;
  heightMm: number;
  insetMm: number;
};

export type CabinetFillerSpec = {
  leftMm: number;
  rightMm: number;
};

export type CabinetEndPanelSpec = {
  left: boolean;
  right: boolean;
};

export type CabinetComposition = {
  /** @deprecated Prefer openingStructure leaves; kept for compatibility. */
  openings: CabinetOpening[];
  openingStructure?: OpeningStructure;
  shelves: CabinetShelfSpec;
  dividers: CabinetDividerSpec;
  doors: CabinetDoorSpec;
  drawers: CabinetDrawerSpec;
  toeKick: CabinetToeKickSpec;
  fillers: CabinetFillerSpec;
  endPanels: CabinetEndPanelSpec;
};

export type CompositionCapabilities = {
  openings: boolean;
  shelves: boolean;
  dividers: boolean;
  doors: boolean;
  drawers: boolean;
  toeKick: boolean;
  fillers: boolean;
  endPanels: boolean;
};
