import type { RenderQuality } from "../../interiorProject";
import {
  PHASE1_LATENCY_ENVIRONMENT,
  PHASE1_SCORECARD_CHECK_IDS,
} from "./definitions";
import type { Phase1ScorecardCheckId } from "./types";

export type Phase1LatencyAppSurface =
  | "tauri-desktop"
  | "browser-dev-substitute";

export type Phase1LatencyEvidence = {
  machine: string;
  appSurface: Phase1LatencyAppSurface;
  substituteReason?: string;
};

export type Phase1LatencySample = {
  frameId: string;
  quality: RenderQuality;
  elapsedMs: number;
  machine: string;
  appSurface?: Phase1LatencyAppSurface;
  substituteReason?: string;
};

export function isPhase1LatencyWithinBudget(sample: Phase1LatencySample): boolean {
  if (sample.quality === "draft") {
    return sample.elapsedMs <= PHASE1_LATENCY_ENVIRONMENT.draftCaptureMaxMs;
  }
  if (sample.quality === "client-preview") {
    return sample.elapsedMs <= PHASE1_LATENCY_ENVIRONMENT.clientPreviewCaptureMaxMs;
  }
  return false;
}

export function listPhase1ScorecardChecks(): readonly Phase1ScorecardCheckId[] {
  return PHASE1_SCORECARD_CHECK_IDS;
}

export function summarizePhase1LatencyEvidence(
  samples: Phase1LatencySample[] | undefined,
): Phase1LatencyEvidence | undefined {
  const first = samples?.[0];
  if (!first) return undefined;
  return {
    machine: first.machine,
    appSurface: first.appSurface ?? PHASE1_LATENCY_ENVIRONMENT.appSurface,
    substituteReason: first.substituteReason?.trim() || undefined,
  };
}

export function describePhase1LatencyEnvironment(): string {
  const env = PHASE1_LATENCY_ENVIRONMENT;
  return [
    env.appSurface,
    `draft ${env.draftWidthPx}x${env.draftHeightPx} <= ${env.draftCaptureMaxMs}ms`,
    `client-preview ${env.clientPreviewWidthPx}x${env.clientPreviewHeightPx} <= ${env.clientPreviewCaptureMaxMs}ms`,
    env.machineClass,
    "warm run after discarded cold run",
  ].join(" · ");
}
