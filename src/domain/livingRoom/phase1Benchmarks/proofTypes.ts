import type { Phase1LatencyEvidence } from "./scorecard";
import type { Phase1BenchmarkFrameId, Phase1ScorecardCheckId } from "./types";

export type Phase1CheckStatus = "pass" | "fail" | "pending";

export type Phase1CheckResult = {
  id: Phase1ScorecardCheckId;
  status: Phase1CheckStatus;
  detail: string;
};

export type Phase1FrameLadderReport = {
  frameId: Phase1BenchmarkFrameId;
  differences: string[];
  pass: boolean;
};

export type Phase1ProofPack = {
  version: 1;
  generatedAt: string;
  latencyEnvironment: string;
  latencyEvidence?: Phase1LatencyEvidence;
  frameCount: number;
  frames: Array<{
    frameId: Phase1BenchmarkFrameId;
    benchmarkId: string;
    cameraKey: string;
    cameraId: string;
    projectId: string;
  }>;
  checks: Phase1CheckResult[];
  frameLadders: Phase1FrameLadderReport[];
  latencyTable: Array<{
    frameId: string;
    draftMs: number | null;
    clientPreviewMs: number | null;
    draftPass: boolean | null;
    clientPreviewPass: boolean | null;
  }>;
  overall: "pass" | "fail" | "pending";
};
