import type { CabinetProject } from "../cabinetDimensions";
import { productionIdentityBlocked } from "../cabinetIdentity";
import { clampJobMeta, patchJobMeta, type ProjectJobMeta } from "../jobMeta";
import { evaluateProjectRules } from "../manufacturingRules";
import { clampGateOverride, overrideReasonOk } from "./gateOverride";
import { getProjectReviewState } from "./operations";
import { createProductionPacketFingerprint } from "./productionFingerprint";
import { snapshotHasDesignDrift } from "./snapshotDrift";
import type {
  GateOverride,
  ProductionGateItem,
  ProductionReadinessGate,
  ProjectReviewState,
  ReleaseGateResult,
} from "./types";

function item(
  id: string,
  label: string,
  failed: boolean,
  failDetail: string,
  passDetail: string,
  overridable: boolean,
): ProductionGateItem {
  return {
    id,
    label,
    detail: failed ? failDetail : passDetail,
    blocking: true,
    overridable,
    status: failed ? "fail" : "pass",
  };
}

/** Production release checklist — distinct from proposal and approval gates. */
export function buildProductionReadinessGate(
  project: CabinetProject,
  override?: GateOverride | null,
): ProductionReadinessGate {
  const job = clampJobMeta(project.job);
  const review = getProjectReviewState(project);
  const open = review.notes.filter((note) => !note.resolved);
  const blockers = open.filter((note) => note.severity === "blocker");
  const manufacturing = evaluateProjectRules(project).filter(
    (issue) => issue.severity === "error" && !issue.autoFixed,
  );
  const approved = job.status === "approved" || job.status === "production";
  const identityBlocked = productionIdentityBlocked(project);
  const snapshotMissing = !review.history[0];
  const drifted = snapshotHasDesignDrift(project);
  const items = [
    item("snapshot", "Revision snapshot", snapshotMissing, "Freeze a revision before production release.", "Revision snapshot on file", false),
    item("drift", "Frozen revision", drifted, "Design drifted from the frozen revision. Re-freeze and re-approve.", "Live design matches the frozen revision", false),
    item("approval", "Approved revision", !approved, "Approve the revision, or record an override reason.", "Revision is approved", true),
    item("blockers", "Unresolved blockers", blockers.length > 0, `${blockers.length} unresolved blocker${blockers.length === 1 ? "" : "s"}`, "No unresolved blockers", false),
    item("identity", "Cabinet identity", identityBlocked, "Adapter loss or unknown family blocks production.", "Cabinet identity is complete", false),
    item("manufacturing", "Manufacturing", manufacturing.length > 0, `${manufacturing.length} manufacturing error${manufacturing.length === 1 ? "" : "s"} still open`, "No open manufacturing errors", false),
  ];
  const hardFails = items.filter((row) => row.status === "fail" && !row.overridable);
  const softFails = items.filter((row) => row.status === "fail" && row.overridable);
  const canOverride = hardFails.length === 0 && softFails.length > 0;
  const overrideOk = canOverride && overrideReasonOk(override);
  const reasons = items.filter((row) => row.status === "fail").map((row) => row.detail);
  return {
    items,
    blockingCount: items.filter((row) => row.status === "fail").length,
    ready: hardFails.length === 0 && (softFails.length === 0 || overrideOk),
    canOverride,
    reasons,
  };
}

export function canReleaseForProduction(
  project: CabinetProject,
  override?: GateOverride | null,
): ReleaseGateResult {
  const gate = buildProductionReadinessGate(project, override);
  return { ok: gate.ready, reasons: gate.reasons, canOverride: gate.canOverride };
}

export function releaseForProduction(
  project: CabinetProject,
  override?: GateOverride | null,
): { job: ProjectJobMeta; review: ProjectReviewState } | { error: string } {
  const recorded = clampGateOverride(override);
  const gate = buildProductionReadinessGate(project, recorded);
  if (!gate.ready) {
    const hint = gate.canOverride ? "; record an override reason" : "";
    return { error: `${gate.reasons.join("; ")}${hint}` };
  }
  const review = getProjectReviewState(project);
  const fingerprint = createProductionPacketFingerprint(project);
  const history = review.history.map((snapshot, index) =>
    index === 0
      ? {
          ...snapshot,
          status: "production" as const,
          releasedForProduction: true,
          productionFingerprint: fingerprint,
          releaseOverride: recorded,
        }
      : snapshot,
  );
  return {
    job: patchJobMeta(project.job, { status: "production" }),
    review: { ...review, history },
  };
}
