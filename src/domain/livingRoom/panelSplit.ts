import type { InteriorObjectEntity, InteriorProject, WallEntity } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import {
  applyPanelAttachmentPose,
  isWallPanelObject,
  readPanelAttachment,
} from "./panelAttachment";
import { wallLength } from "./wallSegmentPlacement";

const MIN_PANEL_WIDTH_MM = 100;

function isReversedForRoom(project: InteriorProject, roomId: string, wall: WallEntity): boolean {
  const oriented = orientWallForRoom(project, roomId, wall);
  return oriented.start.x !== wall.start.x || oriented.start.z !== wall.start.z;
}

function chooseSplitHost(args: {
  alongMm: number;
  widthMm: number;
  firstLen: number;
  secondLen: number;
  reversed: boolean;
  firstWallId: string;
  secondWallId: string;
}): { wallId: string; alongMm: number; segmentLen: number } {
  const total = args.firstLen + args.secondLen;
  const orientedSplit = args.reversed ? args.secondLen : args.firstLen;
  const half = args.widthMm / 2;
  const lo = args.alongMm - half;
  const hi = args.alongMm + half;
  const overlapBefore = Math.max(0, Math.min(hi, orientedSplit) - Math.max(lo, 0));
  const overlapAfter = Math.max(0, Math.min(hi, total) - Math.max(lo, orientedSplit));
  const beforeId = args.reversed ? args.secondWallId : args.firstWallId;
  const afterId = args.reversed ? args.firstWallId : args.secondWallId;
  const beforeLen = orientedSplit;
  const afterLen = total - orientedSplit;
  const beforeFits = beforeLen >= args.widthMm;
  const afterFits = afterLen >= args.widthMm;
  let useBefore = overlapBefore >= overlapAfter;
  if (beforeFits !== afterFits) useBefore = beforeFits;
  else if (!beforeFits && !afterFits) useBefore = beforeLen >= afterLen;
  return {
    wallId: useBefore ? beforeId : afterId,
    alongMm: useBefore ? args.alongMm : args.alongMm - orientedSplit,
    segmentLen: useBefore ? beforeLen : afterLen,
  };
}

function remapPanelAfterSplit(
  project: InteriorProject,
  object: InteriorObjectEntity,
  oldWallId: string,
  firstWallId: string,
  secondWallId: string,
  first: WallEntity,
  second: WallEntity,
): InteriorObjectEntity {
  const attachment = readPanelAttachment(object);
  if (!attachment || attachment.wallId !== oldWallId) return object;
  const firstLen = wallLength(first);
  const secondLen = wallLength(second);
  const reversed = isReversedForRoom(project, object.roomId, first);
  const host = chooseSplitHost({
    alongMm: attachment.alongMm,
    widthMm: object.dimensions.widthMm,
    firstLen,
    secondLen,
    reversed,
    firstWallId,
    secondWallId,
  });
  const widthMm = host.segmentLen < object.dimensions.widthMm
    ? Math.max(MIN_PANEL_WIDTH_MM, Math.floor(host.segmentLen))
    : object.dimensions.widthMm;
  const nextObject = widthMm === object.dimensions.widthMm
    ? object
    : { ...object, dimensions: { ...object.dimensions, widthMm } };
  return applyPanelAttachmentPose(project, nextObject, {
    ...attachment,
    wallId: host.wallId,
    alongMm: host.alongMm,
  });
}

/**
 * After a wall split replaces `oldWallId` with two segments, remap panels using
 * room-oriented alongMm and the panel's full width (shrink if a segment is too short).
 */
export function remapPanelsAfterWallSplit(
  project: InteriorProject,
  oldWallId: string,
  firstWallId: string,
  secondWallId: string,
): InteriorProject {
  const first = project.walls.find((wall) => wall.id === firstWallId);
  const second = project.walls.find((wall) => wall.id === secondWallId);
  if (!first || !second || firstWallId === oldWallId) return project;
  let changed = false;
  const objects = project.objects.map((object) => {
    if (!isWallPanelObject(object)) return object;
    const next = remapPanelAfterSplit(
      project, object, oldWallId, firstWallId, secondWallId, first, second,
    );
    if (next !== object) changed = true;
    return next;
  });
  return changed ? { ...project, objects } : project;
}
