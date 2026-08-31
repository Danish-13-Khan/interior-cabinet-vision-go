import { expectedPhase1LatencySlots } from "./latencySlots";
import {
  describeLatencyDeclaration,
  isOfficialDesktopUserLatency,
  latencyDeclarationGaps,
  type DeclaredLatencyEvidence,
} from "./latencyDeclaration";
import {
  describePhase1LatencyEnvironment,
  isPhase1LatencyWithinBudget,
  summarizePhase1LatencyEvidence,
  type Phase1LatencySample,
} from "./scorecard";
import { PHASE1_LATENCY_ENVIRONMENT } from "./definitions";
import type { Phase1CheckResult } from "./proofTypes";

export function evaluateLatency(samples: Phase1LatencySample[] | undefined): Phase1CheckResult {
  const slots = expectedPhase1LatencySlots();
  if (!samples || samples.length === 0) {
    return {
      id: "latency",
      status: "pending",
      detail: `Fill fixtures/phase-1-benchmarks/latency-samples.json under ${describePhase1LatencyEnvironment()}`,
    };
  }
  const evidence = summarizePhase1LatencyEvidence(samples);
  if (!evidence) {
    return {
      id: "latency",
      status: "pending",
      detail: `Fill fixtures/phase-1-benchmarks/latency-samples.json under ${describePhase1LatencyEnvironment()}`,
    };
  }
  const declared: DeclaredLatencyEvidence = evidence;
  const mismatched = samples.find((sample) =>
    sample.machine !== evidence.machine
      || (sample.appSurface ?? "tauri-desktop") !== evidence.appSurface
      || (sample.substituteReason?.trim() || undefined) !== evidence.substituteReason
      || (sample.buildMode ?? "unspecified") !== evidence.buildMode
  );
  if (mismatched) {
    return {
      id: "latency",
      status: "fail",
      detail: "Latency evidence must use one machine/build mode/surface/reason across all 12 slots.",
    };
  }
  const gaps = latencyDeclarationGaps(declared);
  if (gaps.length) {
    return {
      id: "latency",
      status: "fail",
      detail: `REL-008: name ${gaps.join(" and ")} on latency-samples.json. ${describeLatencyDeclaration(declared)}`,
    };
  }
  if (evidence.appSurface !== "tauri-desktop" && !evidence.substituteReason) {
    return {
      id: "latency",
      status: "fail",
      detail: "Substitute latency evidence requires a non-empty substituteReason in latency-samples.json.",
    };
  }
  const missing = slots.filter(
    (slot) => !samples.some(
      (sample) => sample.frameId === slot.frameId && sample.quality === slot.quality,
    ),
  );
  if (missing.length > 0) {
    return {
      id: "latency",
      status: "pending",
      detail: `Latency samples incomplete (${samples.length}/${slots.length}). Missing e.g. ${missing[0]?.frameId}/${missing[0]?.quality}`,
    };
  }
  const failed = samples.filter((sample) => !isPhase1LatencyWithinBudget(sample));
  const declaration = describeLatencyDeclaration(declared);
  const official = isOfficialDesktopUserLatency(declared);
  if (!official) {
    return {
      id: "latency",
      status: "pending",
      detail: failed.length === 0
        ? `Declared substitute/CI evidence for all ${slots.length} slots. ${declaration}`
        : `Declared substitute/CI evidence collected, but over-budget rows: ${failed.map((sample) => `${sample.frameId}/${sample.quality}=${sample.elapsedMs}ms`).join(", ")}. ${declaration}`,
    };
  }
  return {
    id: "latency",
    status: failed.length === 0 ? "pass" : "fail",
    detail: failed.length === 0
      ? `All ${slots.length} latency samples within Draft ≤${PHASE1_LATENCY_ENVIRONMENT.draftCaptureMaxMs}ms / Client ≤${PHASE1_LATENCY_ENVIRONMENT.clientPreviewCaptureMaxMs}ms. ${declaration}`
      : `Over budget: ${failed.map((sample) => `${sample.frameId}/${sample.quality}=${sample.elapsedMs}ms`).join(", ")}. ${declaration}`,
  };
}
