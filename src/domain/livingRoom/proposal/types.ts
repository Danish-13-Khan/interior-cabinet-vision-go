import type { ProjectJobMeta } from "../../jobMeta";
import type { ProjectQuote } from "../../projectQuote";
import type {
  QuoteSettings,
  QuoteSnapshot,
} from "../../quoteSettings";

export type ProposalStaleOverride = {
  snapshotId: string;
  reason: string;
  overriddenAt: string;
};

export type ProposalViewFrame = {
  cameraId: string;
  viewName: string;
  dataUrl: string;
  projectId?: string;
  sceneFingerprint?: string;
  projectContentHash?: string;
};

export type LiveInteriorQuote = {
  quote: ProjectQuote;
  fingerprint: string;
  frozen: QuoteSnapshot | null;
  stale: boolean;
  staleReason: string | null;
  missingRate: boolean;
};

export type ProposalNamedView = {
  cameraId: string;
  viewName: string;
  selected: boolean;
};

export type ProposalMaterialLine = {
  name: string;
  kind: string;
  role: string;
};

export type ProposalCabinetLine = {
  mark: string;
  name: string;
  sellPrice: number;
};

export type ProposalClientPayload = {
  snapshotId: string;
  cabinets: ProposalCabinetLine[];
  materials: ProposalMaterialLine[];
  views: ProposalNamedView[];
  summaryLines: Array<{ label: string; amount: number }>;
  sceneFingerprint: string;
  projectContentHash: string;
};

export type ProposalSurfaceState = {
  selectedViewCameraIds: string[];
  staleOverride: ProposalStaleOverride | null;
  frozenClient: ProposalClientPayload | null;
};

export type ProposalCommercialState = {
  quote: QuoteSettings;
  job: ProjectJobMeta;
  quoteHistory: QuoteSnapshot[];
  surface: ProposalSurfaceState;
};

export type ProposalDocument = {
  brand: string;
  customerName: string;
  projectNumber: string;
  projectName: string;
  roomName: string;
  revision: string;
  proposalDate: string;
  validUntil: string | null;
  quoteSnapshotId: string;
  sellTotal: number;
  currencyLabel: string;
  taxLabel: string;
  priceDetail: QuoteSettings["priceDetail"];
  draft: boolean;
  staleDisclosed: boolean;
  views: ProposalNamedView[];
  materials: ProposalMaterialLine[];
  cabinets: ProposalCabinetLine[];
  summaryLines: Array<{ label: string; amount: number }>;
  inclusions: string;
  exclusions: string;
  fileName: string;
};

export type ProposalGateItem = {
  id: string;
  label: string;
  detail: string;
  blocking: boolean;
  status: "pass" | "fail" | "warn";
};

export type ProposalGate = {
  items: ProposalGateItem[];
  blockingCount: number;
  ready: boolean;
  canOverrideStale: boolean;
};
