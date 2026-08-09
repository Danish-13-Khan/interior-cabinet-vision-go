import type { CabinetBuildRules } from "../materialSystem";
import type { CabinetComposition } from "../cabinetComposition";
import type { CabinetType } from "../cabinetCapabilities";
import type { CostingSettings } from "../costingSettings";
import type { ProjectStandards } from "../projectStandards";
import type { ProjectJobMeta } from "../jobMeta";
import type { DraftingDisplayPreferences, ProjectDrafting } from "../draftingAnnotations";
import type { CabinetConstructionSpec } from "../cabinetConstructionSpec";
import type { QuoteSettings, QuoteSnapshot } from "../quoteSettings";
import type { ReviewNote, RevisionSnapshot } from "../projectReview/types";
import type { SheetOptimizerSettings } from "../sheetStock";
import type { CabinetHardwareSpec } from "../hardwareSystem";

export type { CabinetComposition } from "../cabinetComposition";
export type { CabinetConstructionSpec } from "../cabinetConstructionSpec";
export type { ProjectDrafting, DraftingDisplayPreferences } from "../draftingAnnotations";
export type { QuoteSettings, QuoteSnapshot } from "../quoteSettings";
export type { SheetOptimizerSettings } from "../sheetStock";
export type { CabinetHardwareSpec } from "../hardwareSystem";
export type { CabinetType } from "../cabinetCapabilities";

export type CabinetDimensions = {
  width: number;
  height: number;
  depth: number;
  boardThickness: number;
  backPanelThickness: number;
};

export type CabinetConfig = {
  type: CabinetType;
  dimensions: CabinetDimensions;
  shelfCount: number;
  hasDoors: boolean;
  drawerCount?: number;
  toeKickHeight: number;
  toeKickInset: number;
  leftEndPanel?: boolean;
  rightEndPanel?: boolean;
  buildRules?: Partial<CabinetBuildRules>;
  /** Structured Core Cabinets–style composition. Flat fields stay in sync for geometry. */
  composition?: CabinetComposition;
  /** How the carcass, shelves, doors, and drawer boxes are built. */
  construction?: CabinetConstructionSpec;
  /** Per-cabinet hardware, accessories, and appliance insert selection. */
  hardware?: CabinetHardwareSpec;
};

export type CabinetPlacement = {
  x: number;
  y: number;
  z: number;
  rotation: 0 | 90 | 180 | 270;
  attachment: "floor" | "back-wall" | "left-wall" | "right-wall";
};

export type CabinetInstance = {
  id: string;
  name: string;
  placement: CabinetPlacement;
  config: CabinetConfig;
  layerId?: string;
  groupId?: string | null;
};

export type CabinetLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
};

export type CabinetGroup = {
  id: string;
  name: string;
};

export type ProjectPreferences = {
  snapSizeMm: number;
  showGrid: boolean;
  autoSaveToBrowser: boolean;
  costing?: CostingSettings;
  quote?: QuoteSettings;
  sheetOptimizer?: SheetOptimizerSettings;
  standards?: ProjectStandards;
  drafting?: DraftingDisplayPreferences;
};

export type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

export type CabinetProject = {
  version: number;
  cabinets: CabinetInstance[];
  layers?: CabinetLayer[];
  groups?: CabinetGroup[];
  preferences?: ProjectPreferences;
  job?: ProjectJobMeta;
  drafting?: ProjectDrafting;
  quoteHistory?: QuoteSnapshot[];
  /** Live review / issue flags carried with the project. */
  reviewNotes?: ReviewNote[];
  /** Frozen revision snapshots for approval / compare / release. */
  revisionHistory?: RevisionSnapshot[];
  /** Multi-room plan; each room owns its cabinets and RoomConfig. */
  rooms?: import("../projectRooms/types").ProjectRoom[];
  activeRoomId?: string;
  /** Named drawing sheets with viewports, notes, and revision rows. */
  sheetSet?: import("../sheetDocuments/types").ProjectSheetSet;
};
