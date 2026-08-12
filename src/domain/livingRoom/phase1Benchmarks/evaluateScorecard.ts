import { listPhase1BenchmarkFrames } from "./buildBenchmarks";
import { PHASE1_BENCHMARK_NOW } from "./definitions";
import {
  evaluateAutomationPlaceholder,
  evaluateDataSafety,
  evaluateFraming,
  evaluateGrounding,
  evaluateHonesty,
  evaluateLatency,
  evaluateWindowKey,
} from "./evaluateChecks";
import { evaluateLadder, ladderDifferences } from "./evaluateLadder";
import {
  describePhase1LatencyEnvironment,
  isPhase1LatencyWithinBudget,
  type Phase1LatencySample,
} from "./scorecard";
import type { Phase1ProofPack } from "./proofTypes";

function buildLatencyTable(samples: Phase1LatencySample[] | undefined) {
  return listPhase1BenchmarkFrames().map((frame) => {
    const draft = samples?.find(
      (sample) => sample.frameId === frame.frameId && sample.quality === "draft",
    );
    const client = samples?.find(
      (sample) => sample.frameId === frame.frameId && sample.quality === "client-preview",
    );
    return {
      frameId: frame.frameId,
      draftMs: draft?.elapsedMs ?? null,
      clientPreviewMs: client?.elapsedMs ?? null,
      draftPass: draft ? isPhase1LatencyWithinBudget(draft) : null,
      clientPreviewPass: client ? isPhase1LatencyWithinBudget(client) : null,
    };
  });
}

/** Evaluate Phase 1 scorecard. Latency/automation may stay pending until filled. */
export function evaluatePhase1Scorecard(options?: {
  latencySamples?: Phase1LatencySample[];
  generatedAt?: string;
}): Phase1ProofPack {
  const frames = listPhase1BenchmarkFrames();
  const frameLadders = frames.map((frame) => ladderDifferences(frame.frameId));
  const checks = [
    evaluateLadder(),
    evaluateGrounding(),
    evaluateWindowKey(),
    evaluateFraming(),
    evaluateLatency(options?.latencySamples),
    evaluateHonesty(),
    evaluateAutomationPlaceholder(),
    evaluateDataSafety(),
  ];
  const hasFail = checks.some((check) => check.status === "fail");
  const hasPending = checks.some((check) => check.status === "pending");
  return {
    version: 1,
    generatedAt: options?.generatedAt ?? PHASE1_BENCHMARK_NOW,
    latencyEnvironment: describePhase1LatencyEnvironment(),
    frameCount: frames.length,
    frames: frames.map((frame) => ({
      frameId: frame.frameId,
      benchmarkId: frame.benchmarkId,
      cameraKey: frame.cameraKey,
      cameraId: frame.cameraId,
      projectId: frame.project.id,
    })),
    checks,
    frameLadders,
    latencyTable: buildLatencyTable(options?.latencySamples),
    overall: hasFail ? "fail" : hasPending ? "pending" : "pass",
  };
}

export type {
  Phase1CheckResult,
  Phase1CheckStatus,
  Phase1FrameLadderReport,
  Phase1ProofPack,
} from "./proofTypes";
