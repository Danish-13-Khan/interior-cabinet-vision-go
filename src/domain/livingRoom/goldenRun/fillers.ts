import { persistCabinetIdentityOnObject, RUN_FILLER_CATALOG_ID } from "../../cabinetIdentity";
import { orientWallForRoom } from "../../interiorProject";
import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import { orderRunMembers } from "../../cabinetRuns";
import { cabinetRunForObject, isCabinetRunFiller } from "../wardrobePlacement";
import { attached, placementAt, wallLength } from "../wallSegmentPlacement";
import { GOLDEN_RUN_FILLER_IDS } from "./types";

const FILLER_WIDTH_MM = 100;
const FILLER_DEPTH_MM = 18;

function runMembers(project: InteriorProject, runId: string) {
  return project.objects.filter((object) => {
    const meta = cabinetRunForObject(object);
    return meta?.runId === runId && !isCabinetRunFiller(object);
  });
}

function makeFiller(
  project: InteriorProject,
  runId: string,
  side: "start" | "end",
  member: InteriorObjectEntity,
  center: number,
): InteriorObjectEntity {
  const wallId = cabinetRunForObject(member)!.wallId;
  const wall = orientWallForRoom(
    project,
    member.roomId,
    project.walls.find((item) => item.id === wallId)!,
  );
  const draft: InteriorObjectEntity = {
    id: GOLDEN_RUN_FILLER_IDS[side],
    roomId: member.roomId,
    kind: "cabinet",
    category: "filler",
    catalogItemId: RUN_FILLER_CATALOG_ID,
    name: "Run filler",
    position: { ...member.position },
    rotation: { ...member.rotation },
    dimensions: {
      widthMm: FILLER_WIDTH_MM,
      heightMm: member.dimensions.heightMm,
      depthMm: FILLER_DEPTH_MM,
    },
    materialSlots: {},
    parameters: { filler: true },
    extensions: {
      placement: "wall",
      wallAttachment: { wallId },
      cabinetRunFiller: { runId, side },
    },
  };
  return persistCabinetIdentityOnObject(attached(draft, placementAt(wall, draft, center)));
}

/** Stamp 100 mm end fillers so the golden run stays filler-forced on a long wall. */
export function seedGoldenRunFillers(project: InteriorProject, runId: string): InteriorProject {
  const members = runMembers(project, runId);
  const wallId = cabinetRunForObject(members[0]!)?.wallId;
  const stored = project.walls.find((item) => item.id === wallId);
  if (!stored || members.length < 2) return project;
  const wall = orientWallForRoom(project, members[0]!.roomId, stored);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const along = (object: InteriorObjectEntity) =>
    (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const ordered = orderRunMembers(members, along);
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;
  const startCenter = along(first) - first.dimensions.widthMm / 2 - FILLER_WIDTH_MM / 2;
  const endCenter = along(last) + last.dimensions.widthMm / 2 + FILLER_WIDTH_MM / 2;
  const without = project.objects.filter((object) => !isCabinetRunFiller(object));
  return {
    ...project,
    objects: [
      ...without,
      makeFiller(project, runId, "start", first, startCenter),
      makeFiller(project, runId, "end", last, endCenter),
    ],
  };
}
