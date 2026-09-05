import type { InteriorObjectEntity, InteriorProject, WallEntity } from "../interiorProject";
import { FILLER_MAX_MM, FILLER_MIN_MM, fillerWidthForGap, orderRunMembers } from "../cabinetRuns";
import { cabinetRunForObject } from "./cabinetRunLayout";
import {
  countCabinetRunFillers,
  isCabinetRunFiller,
  updateCabinetRunLayout,
} from "./cabinetRunFillers";
import {
  collectWallOccupancySpans,
  freeSegmentsInInterval,
  type AlongWallSpan,
} from "./cabinetRunPlacementPreview";
import { wallLength } from "./wallSegmentPlacement";

export type SuggestedFiller = {
  side: "start" | "end" | "between";
  widthMm: number;
  index?: number;
};

export type CabinetRunCompleteProposal = {
  runId: string;
  wallId: string;
  remainingMm: number;
  suggestedFillers: SuggestedFiller[];
  leftoverGapsMm: number[];
  canAutoFill: boolean;
  summary: string;
};

export type CabinetRunCompleteResult = {
  project: InteriorProject;
  proposal: CabinetRunCompleteProposal;
  applied: boolean;
  leftoverMessage: string | null;
};

function offsetsAlongWall(object: InteriorObjectEntity, wall: WallEntity) {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center = (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  return { start: center - half, end: center + half };
}

function runMembers(project: InteriorProject, runId: string) {
  return project.objects.filter((object) => {
    const meta = cabinetRunForObject(object);
    return meta?.runId === runId && !isCabinetRunFiller(object);
  });
}

function withoutMemberIds(occupied: AlongWallSpan[], ids: ReadonlySet<string>): AlongWallSpan[] {
  return occupied.filter((span) => {
    if (ids.has(span.id)) return false;
    // Merged ids look like "a+b" — drop if any bound id is present.
    const parts = span.id.split("+");
    return !parts.some((part) => ids.has(part));
  });
}

function considerInterval(
  occupied: AlongWallSpan[],
  startMm: number,
  endMm: number,
  side: SuggestedFiller["side"],
  index: number | undefined,
  suggestedFillers: SuggestedFiller[],
  leftoverGapsMm: number[],
): number {
  const segments = freeSegmentsInInterval(occupied, startMm, endMm);
  let freeMm = 0;
  for (const segment of segments) {
    freeMm += segment.lengthMm;
    if (segment.lengthMm <= 0.5) continue;
    if (side === "between") {
      const widthMm = fillerWidthForGap(segment.lengthMm);
      if (widthMm !== null) {
        suggestedFillers.push({ side, widthMm: Math.round(widthMm), index });
      } else {
        leftoverGapsMm.push(Math.round(segment.lengthMm));
      }
    } else if (segment.lengthMm >= FILLER_MIN_MM && segment.lengthMm <= FILLER_MAX_MM) {
      suggestedFillers.push({ side, widthMm: Math.round(segment.lengthMm), index });
    } else {
      leftoverGapsMm.push(Math.round(segment.lengthMm));
    }
  }
  return freeMm;
}

/** Pure proposal: what Complete Run would add for leftover gaps. */
export function proposeCabinetRunComplete(
  project: InteriorProject,
  runId: string,
): CabinetRunCompleteProposal | null {
  const members = runMembers(project, runId);
  const metadata = members[0] ? cabinetRunForObject(members[0]) : null;
  if (!metadata || members.length === 0) return null;

  const roomId = members[0]!.roomId;
  const collected = collectWallOccupancySpans(project, metadata.wallId, roomId);
  if (!collected) return null;
  const { wall, lengthMm, occupied } = collected;
  if (!lengthMm) return null;

  const cabinets = orderRunMembers(members, (cabinet) => offsetsAlongWall(cabinet, wall).start);
  const suggestedFillers: SuggestedFiller[] = [];
  const leftoverGapsMm: number[] = [];
  let remainingRaw = 0;

  for (let index = 0; index < cabinets.length - 1; index += 1) {
    const current = cabinets[index]!;
    const next = cabinets[index + 1]!;
    const currentSpan = offsetsAlongWall(current, wall);
    const nextSpan = offsetsAlongWall(next, wall);
    const intervalOccupied = withoutMemberIds(occupied, new Set([current.id, next.id]));
    remainingRaw += considerInterval(
      intervalOccupied,
      currentSpan.end,
      nextSpan.start,
      "between",
      index + 1,
      suggestedFillers,
      leftoverGapsMm,
    );
  }

  const firstSpan = offsetsAlongWall(cabinets[0]!, wall);
  const lastSpan = offsetsAlongWall(cabinets[cabinets.length - 1]!, wall);
  remainingRaw += considerInterval(
    withoutMemberIds(occupied, new Set([cabinets[0]!.id])),
    0,
    firstSpan.start,
    "start",
    undefined,
    suggestedFillers,
    leftoverGapsMm,
  );
  remainingRaw += considerInterval(
    withoutMemberIds(occupied, new Set([cabinets[cabinets.length - 1]!.id])),
    lastSpan.end,
    lengthMm,
    "end",
    undefined,
    suggestedFillers,
    leftoverGapsMm,
  );

  const remainingMm = Math.round(Math.max(0, remainingRaw));
  const widths = suggestedFillers.map((item) => item.widthMm).join(", ");
  const summary = suggestedFillers.length
    ? `Remaining ${remainingMm} mm · ${suggestedFillers.length} filler${suggestedFillers.length === 1 ? "" : "s"} (${widths} mm)`
    : leftoverGapsMm.length
      ? `Remaining ${remainingMm} mm · gaps outside filler range (${leftoverGapsMm.join(", ")} mm)`
      : `Remaining ${remainingMm} mm · run already complete`;

  return {
    runId,
    wallId: metadata.wallId,
    remainingMm,
    suggestedFillers,
    leftoverGapsMm,
    canAutoFill: suggestedFillers.length > 0,
    summary,
  };
}

/**
 * Enable fillers and reflow. Returns next project plus leftover note when gaps
 * cannot be filled by the standard filler band.
 */
export function completeCabinetRun(
  project: InteriorProject,
  runId: string,
  options: { alignment?: "start" | "end" | "center" } = {},
): CabinetRunCompleteResult | null {
  const proposal = proposeCabinetRunComplete(project, runId);
  if (!proposal) return null;

  const next = updateCabinetRunLayout(project, runId, {
    fillersEnabled: true,
    ...(options.alignment ? { alignment: options.alignment } : {}),
  });
  const after = proposeCabinetRunComplete(next, runId);
  const leftover = after?.leftoverGapsMm ?? proposal.leftoverGapsMm;
  const fillerCount = countCabinetRunFillers(next, runId);
  const leftoverMessage = leftover.length
    ? `Leftover ${leftover.join(", ")} mm outside ${FILLER_MIN_MM}–${FILLER_MAX_MM} mm filler range — edit cabinets or place manually.`
    : null;

  return {
    project: next,
    proposal: {
      ...proposal,
      remainingMm: after?.remainingMm ?? proposal.remainingMm,
      suggestedFillers: after?.suggestedFillers.length
        ? after.suggestedFillers
        : proposal.suggestedFillers,
      leftoverGapsMm: leftover,
      summary: leftoverMessage
        ? `${fillerCount} filler${fillerCount === 1 ? "" : "s"} applied · ${leftoverMessage}`
        : `${fillerCount} filler${fillerCount === 1 ? "" : "s"} applied · run complete`,
    },
    applied: true,
    leftoverMessage,
  };
}
