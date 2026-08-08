import type { CabinetCost, ProjectCost } from "../costing";
import type {
  MaterialBoardEstimate,
  ProductionCutlistGroup,
  ProductionCutlistLine,
} from "../productionCutlist";
import type { ProjectJobMeta } from "../jobMeta";
import type { ProjectQuote } from "../projectQuote";
import type { QuoteSnapshot } from "../quoteSettings";
import type { ProjectSheetYield } from "../sheetYield";
import type { CabinetHardwareSummary, HardwareScheduleRow } from "../hardwareSystem";
import type { ProjectReviewState, RevisionFingerprint } from "../projectReview";

export type CabinetScheduleRow = {
  mark: string;
  cabinetId: string;
  cabinetName: string;
  typeLabel: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  x: number;
  z: number;
  rotation: number;
  partCount: number;
  totalCost: number;
  runId: string | null;
  runLabel: string | null;
};

export type RunSummaryRow = {
  runId: string;
  label: string;
  side: string;
  axis: string;
  cabinetCount: number;
  cabinetNames: string[];
  lengthMm: number;
  fillerCount: number;
  countertopCount: number;
  hasCorner: boolean;
};

export type ProjectReport = {
  job: ProjectJobMeta;
  jobTitle: string;
  jobSubtitle: string;
  summary: {
    itemCount: number;
    cabinetCount: number;
    roomSizeLabel: string;
    partLineCount: number;
    runCount: number;
    statusLabel: string;
    projectNumber: string;
    revision: string;
    customerName: string;
  };
  itemList: Array<{
    id: string;
    name: string;
    typeLabel: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    x: number;
    z: number;
    rotation: number;
  }>;
  cabinetSchedule: CabinetScheduleRow[];
  runSummaries: RunSummaryRow[];
  perItemCutlists: Array<{
    cabinetId: string;
    cabinetName: string;
    lines: ProductionCutlistLine[];
    cost: CabinetCost;
  }>;
  productionCutlist: ProductionCutlistLine[];
  materialSummary: MaterialBoardEstimate[];
  sheetYield: ProjectSheetYield;
  hardwareSchedule: HardwareScheduleRow[];
  hardwareByCabinet: CabinetHardwareSummary[];
  groupedByMaterial: ProductionCutlistGroup[];
  groupedByThickness: ProductionCutlistGroup[];
  groupedByCabinet: ProductionCutlistGroup[];
  projectCost: ProjectCost;
  quote: ProjectQuote;
  quoteHistory: QuoteSnapshot[];
  review: ProjectReviewState;
  currentFingerprint: RevisionFingerprint;
  packetSections: Array<{ id: string; title: string; description: string }>;
};
