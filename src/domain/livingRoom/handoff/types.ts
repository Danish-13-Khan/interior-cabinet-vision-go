import type { AdapterDiagnostic } from "../../cabinetIdentity";
import type {
  RevisionChangeEntry,
  RevisionFingerprint,
} from "../../projectReview";

export const HANDOFF_EXTENSION = "engineeringHandoff";

export type HandoffCabinetLine = {
  objectId: string;
  cabinetId: string;
  name: string;
  cabinetType: string;
  familyId: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  golden: boolean;
  lossy: boolean;
};

export type HandoffWarning = {
  code: string;
  severity: "warning" | "error";
  path: string;
  message: string;
  objectId?: string;
  blocking: boolean;
};

export type HandoffGateItem = {
  id: string;
  label: string;
  detail: string;
  blocking: boolean;
};

export type HandoffGate = {
  items: HandoffGateItem[];
  blockingCount: number;
  ready: boolean;
  lossyGoldenCount: number;
};

export type HandoffSummary = {
  revision: string;
  roomId: string;
  roomName: string;
  cabinetCount: number;
  goldenCount: number;
  cabinets: HandoffCabinetLine[];
  diagnostics: AdapterDiagnostic[];
  warnings: HandoffWarning[];
  lossyGoldenIds: string[];
  selectedCabinetIds: string[];
  productionBlocked: boolean;
};

export type EngineeringHandoffRecord = {
  handedOffAt: string;
  revision: string;
  cabinetIds: string[];
  fingerprint: RevisionFingerprint;
  designFingerprint: string;
  selectedInteriorObjectIds: string[];
};

export type PostApprovalDrift = {
  handedOff: boolean;
  drifted: boolean;
  revision: string | null;
  summary: string;
  changes: RevisionChangeEntry[];
};
