import type { InteriorObjectEntity, InteriorProject, Point3Mm, Size3Mm } from "../interiorProject";
import { inspectLivingRoomPlan, isBlockingLivingRoomPlanIssue } from "./planConstraints";
import { previewCabinetRunPlacement } from "./cabinetRunPlacementPreview";
import { FILLER_MIN_MM, FILLER_MAX_MM } from "../cabinetRuns";

export type CabinetRunPreDropCode =
  | "fits"
  | "outside-room"
  | "overlap"
  | "opening-conflict"
  | "no-fit"
  | "needs-filler";

export type CabinetRunPreDropResult = {
  ok: boolean;
  code: CabinetRunPreDropCode;
  message: string;
  advisory?: boolean;
};

export type CabinetRunPreDropProposal = {
  object?: InteriorObjectEntity;
  /** Ghost / proposed placement when object is not yet in the project. */
  ghost?: {
    id?: string;
    roomId: string;
    name?: string;
    kind?: InteriorObjectEntity["kind"];
    category?: string;
    catalogItemId?: string;
    position: Point3Mm;
    rotationY?: number;
    dimensions: Size3Mm;
  };
  wallId?: string | null;
  runId?: string | null;
};

function ghostAsObject(proposal: CabinetRunPreDropProposal): InteriorObjectEntity | null {
  if (proposal.object) return proposal.object;
  const ghost = proposal.ghost;
  if (!ghost) return null;
  const id = ghost.id ?? `__predrop:${Date.now()}`;
  return {
    id,
    roomId: ghost.roomId,
    kind: ghost.kind ?? "cabinet",
    category: ghost.category ?? "cabinet",
    catalogItemId: ghost.catalogItemId ?? "living:predrop",
    name: ghost.name ?? "Cabinet",
    position: ghost.position,
    rotation: { x: 0, y: ghost.rotationY ?? 0, z: 0 },
    dimensions: ghost.dimensions,
    materialSlots: {},
    parameters: {},
    extensions: proposal.wallId
      ? { wallAttachment: { wallId: proposal.wallId } }
      : undefined,
  };
}

function mapIssueCode(code: string): CabinetRunPreDropCode | null {
  if (code === "outside-room") return "outside-room";
  if (code === "overlap") return "overlap";
  if (code === "opening-clearance") return "opening-conflict";
  return null;
}

/**
 * Validate a proposed cabinet placement before commit.
 * Hard fails block drop; needs-filler is advisory (allow drop).
 */
export function validateCabinetRunPreDrop(
  project: InteriorProject,
  proposal: CabinetRunPreDropProposal,
): CabinetRunPreDropResult {
  const candidate = ghostAsObject(proposal);
  if (!candidate) {
    return { ok: false, code: "no-fit", message: "No placement candidate." };
  }

  const wallId = proposal.wallId
    ?? (candidate.extensions?.wallAttachment && typeof candidate.extensions.wallAttachment === "object"
      ? (candidate.extensions.wallAttachment as { wallId?: string }).wallId
      : undefined);

  if (wallId) {
    const preview = previewCabinetRunPlacement(project, wallId, {
      runId: proposal.runId,
      candidateWidthMm: candidate.dimensions.widthMm,
      roomId: candidate.roomId,
    });
    if (preview && preview.candidateFits === false) {
      return {
        ok: false,
        code: "no-fit",
        message: `Too wide for remaining wall space (${preview.remainingMm} mm free).`,
      };
    }
  }

  const withoutSelf = {
    ...project,
    objects: project.objects.filter((object) => object.id !== candidate.id),
  };
  const probed: InteriorProject = {
    ...withoutSelf,
    objects: [...withoutSelf.objects, candidate],
  };
  const issues = inspectLivingRoomPlan(probed).filter((issue) => issue.objectIds.includes(candidate.id));
  const blocking = issues.filter(isBlockingLivingRoomPlanIssue);
  for (const issue of blocking) {
    const code = mapIssueCode(issue.code);
    if (code) {
      return { ok: false, code, message: issue.message };
    }
  }
  const opening = issues.find((issue) => issue.code === "opening-clearance");
  if (opening) {
    return { ok: false, code: "opening-conflict", message: opening.message };
  }

  if (wallId) {
    const preview = previewCabinetRunPlacement(probed, wallId, { runId: proposal.runId, roomId: candidate.roomId });
    const leftover = preview?.freeSegments.find((segment) => (
      segment.lengthMm > 0
      && (segment.lengthMm < FILLER_MIN_MM || segment.lengthMm > FILLER_MAX_MM)
      && segment.lengthMm < candidate.dimensions.widthMm
    ));
    // Soft advisory when a filler-sized leftover remains after this place.
    const fillerGap = preview?.freeSegments.find((segment) => (
      segment.lengthMm >= FILLER_MIN_MM && segment.lengthMm <= FILLER_MAX_MM
    ));
    if (fillerGap) {
      return {
        ok: true,
        code: "needs-filler",
        advisory: true,
        message: `Fits — leftover ${fillerGap.lengthMm} mm may need a filler.`,
      };
    }
    if (leftover && leftover.lengthMm > 0) {
      return {
        ok: true,
        code: "needs-filler",
        advisory: true,
        message: `Fits — ${leftover.lengthMm} mm leftover outside filler range.`,
      };
    }
  }

  return { ok: true, code: "fits", message: "Fits." };
}

export function preDropReasonLabel(result: CabinetRunPreDropResult): string {
  if (result.code === "fits") return "";
  return result.message;
}
