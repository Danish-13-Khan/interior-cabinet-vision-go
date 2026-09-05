/** Lab proposal geometry from Gemini Vision (pre- and post-normalize). */

export type ProposalUnits = "mm" | "cm" | "m" | "ft" | "in";
export type ScaleConfidence = "low" | "medium" | "high";
export type OpeningKind = "door" | "window" | "opening";

export type ProposalPoint = { x: number; y: number };

export type ProposalRoom = {
  id: string;
  name?: string;
  outlineMm: ProposalPoint[];
};

export type ProposalWall = {
  id: string;
  a: ProposalPoint;
  b: ProposalPoint;
  thicknessMm?: number;
};

export type ProposalOpening = {
  id: string;
  kind: OpeningKind;
  wallId?: string;
  widthMm?: number;
  heightMm?: number;
};

export type GeminiFloorProposal = {
  units: ProposalUnits;
  scaleConfidence: ScaleConfidence;
  assumedWallHeightMm: number;
  rooms: ProposalRoom[];
  walls: ProposalWall[];
  openings?: ProposalOpening[];
  notes?: string[];
};

export type VisionUsageMetrics = {
  latencyMs: number;
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  model: string;
};

export type VisionExtractOk = {
  ok: true;
  proposal: GeminiFloorProposal;
  rawText: string;
  metrics: VisionUsageMetrics;
};

export type VisionExtractErr = {
  ok: false;
  error: string;
  rawText?: string;
  validationErrors?: string[];
  metrics?: VisionUsageMetrics;
};

export type VisionExtractResult = VisionExtractOk | VisionExtractErr;
