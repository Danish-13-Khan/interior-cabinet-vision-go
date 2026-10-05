import { supportsDoors, supportsDrawers } from "../cabinetCapabilities";
import { handledFrontCount, resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import type { CabinetConfig } from "../cabinetDimensions";
import { runBandForType } from "../cabinetRuns";
import { golaProfilesForType, type GolaProfiles } from "../frontSystem";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { cabinetRunForObject } from "./cabinetRunLayout";
import { isCabinetRunFiller } from "./cabinetRunFillers";
import type { ModelQualityIssue } from "./modelQualityFeedback";

type Fronted = { object: InteriorObjectEntity; config: CabinetConfig; gola: GolaProfiles | null };

function frontedCabinet(object: InteriorObjectEntity): Fronted | null {
  if (object.kind !== "cabinet" || isCabinetRunFiller(object)) return null;
  const config = cabinetFromObject(object)?.config;
  if (!config || !(supportsDoors(config.type) || supportsDrawers(config.type))) return null;
  const system = normalizeConstructionSpec(config.type, config.construction).frontSystem;
  return { object, config, gola: system?.kind === "gola" ? system.profiles : null };
}

/** Gola fronts no profile runs along (e.g. a lone tall door); they keep the cabinet's handle. */
export function golaFrontsKeepingHandles(object: InteriorObjectEntity): number {
  const cabinet = frontedCabinet(object);
  return cabinet?.gola ? handledFrontCount(resolveFrontGaps(cabinet.config)) : 0;
}

/** A neighbour breaks the profile line when it shares a profile at a different size, or skips gola in the same band. */
function breaksLine(self: Fronted & { gola: GolaProfiles }, other: Fronted): boolean {
  if (!other.gola) return runBandForType(other.config.type) === runBandForType(self.config.type);
  const shared = golaProfilesForType(self.config.type).filter((kind) => golaProfilesForType(other.config.type).includes(kind));
  return shared.some((kind) =>
    self.gola[kind].heightMm !== other.gola![kind].heightMm || self.gola[kind].depthMm !== other.gola![kind].depthMm);
}

export type GolaRunMismatch = { runId: string; profiles: GolaProfiles; memberIds: string[]; differingIds: string[] };

/** Run members whose gola sizes would not line up with this cabinet's profile. */
export function golaRunMismatch(project: InteriorProject, object: InteriorObjectEntity): GolaRunMismatch | null {
  const runId = cabinetRunForObject(object)?.runId;
  const self = frontedCabinet(object);
  if (!runId || !self?.gola) return null;
  const members = project.objects
    .filter((item) => item.id !== object.id && cabinetRunForObject(item)?.runId === runId)
    .flatMap((item) => frontedCabinet(item) ?? []);
  const differing = members.filter((other) => breaksLine({ ...self, gola: self.gola! }, other));
  if (!differing.length) return null;
  return {
    runId,
    profiles: self.gola,
    memberIds: members.map((item) => item.object.id),
    differingIds: differing.map((item) => item.object.id),
  };
}

/** Review rows for gola fronts left with handles and runs whose profiles would not line up. */
export function collectGolaReviewIssues(project: InteriorProject): ModelQualityIssue[] {
  const issues: ModelQualityIssue[] = [];
  const reportedRuns = new Set<string>();
  for (const object of project.objects.filter((item) => item.roomId === project.activeRoomId)) {
    const handles = golaFrontsKeepingHandles(object);
    if (handles > 0) {
      issues.push({
        id: `gola-handles:${object.id}`,
        code: "gola-front-without-profile",
        severity: "warning",
        title: `${object.name}: ${handles} gola front${handles === 1 ? "" : "s"} keep${handles === 1 ? "s" : ""} a handle`,
        detail: "No gola profile runs along these fronts (for example a single full-height door), so they keep the cabinet's handle.",
        objectId: object.id,
        blocking: false,
        kind: "assembly",
      });
    }
    const mismatch = golaRunMismatch(project, object);
    if (!mismatch || reportedRuns.has(mismatch.runId)) continue;
    reportedRuns.add(mismatch.runId);
    const names = project.objects.filter((item) => mismatch.differingIds.includes(item.id)).map((item) => item.name);
    issues.push({
      id: `gola-run:${mismatch.runId}`,
      code: "gola-run-mismatch",
      severity: "warning",
      title: `${object.name}: gola profile will not line up along the run`,
      detail: `Different gola sizes or handle fronts on ${names.join(", ")}. Use "Match run" in the cabinet's Construction section.`,
      objectId: object.id,
      blocking: false,
      kind: "assembly",
    });
  }
  return issues;
}
