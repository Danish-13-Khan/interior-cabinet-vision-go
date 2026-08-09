import type { SnapGuide } from "../placementSnap";
import type { CabinetRun, CountertopSegment, RunFiller } from "../cabinetLibrary";
import type { ProjectDrafting } from "../draftingAnnotations";

export type TechnicalViewKind =
  | "top"
  | "front"
  | "side"
  | "section"
  | "detail"
  | "report";

export type TechnicalViewResult = {
  width: number;
  height: number;
  svg: string;
  originX: number;
  originY: number;
  scale: number;
};

export type TechnicalViewOptions = {
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  activeOpeningId?: string | null;
  mode?: "interactive" | "print";
  showGrid?: boolean;
  showDimensionChains?: boolean;
  showOverallDims?: boolean;
  showSelectedDims?: boolean;
  showOpeningDims?: boolean;
  showRunDims?: boolean;
  showClearanceDims?: boolean;
  showWallLabels?: boolean;
  showRunBands?: boolean;
  showRunLabels?: boolean;
  showFillers?: boolean;
  showCountertopSpans?: boolean;
  showElevationDetails?: boolean;
  showCabinetTags?: boolean;
  showOpeningTags?: boolean;
  showApplianceTags?: boolean;
  showSectionMarkers?: boolean;
  dimMinSegmentMm?: number;
  /** Optional override for section cut plane X (mm). */
  cutPlaneXMm?: number;
  title?: string;
  projectName?: string;
  sheetMeta?: string;
  sheetCode?: string;
  /** Highlight selected drafting object id (note/leader/dim/tag). */
  activeDraftObjectId?: string | null;
  snapGuides?: SnapGuide[];
  ghostPlacement?: {
    cabinetId: string;
    x: number;
    y: number;
    z: number;
  } | null;
  runs?: CabinetRun[];
  fillers?: RunFiller[];
  countertops?: CountertopSegment[];
  drafting?: ProjectDrafting;
};
