import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { isWallPanelObject } from "../livingRoom/panelAttachment";
import type { KitchenLayout } from "./types";
import { hostWallId, objectSpanOnWall } from "./composers/wallPieces";

const isLeg = (object: InteriorObjectEntity) => object.id.includes("-leg-");
const isPrimaryBase = (object: InteriorObjectEntity) => /-(base-a|drawer|base-b)$/.test(object.id);

function heading(project: InteriorProject, wallId: string | undefined): "x" | "z" | null {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall) return null;
  return Math.abs(wall.end.x - wall.start.x) >= Math.abs(wall.end.z - wall.start.z) ? "x" : "z";
}

/** Kitchen layout read back from the built project (not the spec): straight, L or parallel. */
export function builtKitchenLayout(project: InteriorProject, roomId: string): KitchenLayout | null {
  const objects = project.objects.filter((object) => object.roomId === roomId);
  const primary = objects.find(isPrimaryBase);
  if (!primary) return null;
  const legs = objects.filter(isLeg);
  if (legs.length === 0) return "straight";
  if (legs.length < 2) return null;
  const primaryWall = hostWallId(primary);
  const legWall = hostWallId(legs[0]!);
  if (!legWall || legWall === primaryWall || legs.some((leg) => hostWallId(leg) !== legWall)) return null;
  return heading(project, primaryWall) === heading(project, legWall) ? "parallel" : "L";
}

/** Pairs of wall-hosted objects (not decor panels) that overlap along the same wall and vertically. */
export function hostedObjectCollisions(project: InteriorProject, roomId: string): Array<[string, string]> {
  const hosted = project.objects.filter((object) =>
    object.roomId === roomId && hostWallId(object) && !isWallPanelObject(object));
  const hits: Array<[string, string]> = [];
  for (let i = 0; i < hosted.length; i += 1) {
    for (let j = i + 1; j < hosted.length; j += 1) {
      const a = hosted[i]!;
      const b = hosted[j]!;
      if (hostWallId(a) !== hostWallId(b)) continue;
      const wall = project.walls.find((item) => item.id === hostWallId(a))!;
      const sa = objectSpanOnWall(a, wall);
      const sb = objectSpanOnWall(b, wall);
      const along = sa.startMm < sb.endMm - 1 && sb.startMm < sa.endMm - 1;
      const vertical = a.position.y < b.position.y + b.dimensions.heightMm - 1
        && b.position.y < a.position.y + a.dimensions.heightMm - 1;
      if (along && vertical) hits.push([a.id, b.id]);
    }
  }
  return hits;
}

/** Plan footprint overlap between two floor objects (axis-aligned by rotation 0/90/180/270). */
function footprint(object: InteriorObjectEntity) {
  const rot = Math.round(((object.rotation?.y ?? 0) % 180 + 180) % 180);
  const across = rot === 90 ? object.dimensions.depthMm : object.dimensions.widthMm;
  const deep = rot === 90 ? object.dimensions.widthMm : object.dimensions.depthMm;
  return { minX: object.position.x - across / 2, maxX: object.position.x + across / 2, minZ: object.position.z - deep / 2, maxZ: object.position.z + deep / 2 };
}

/** L / parallel legs whose plan footprint runs into the primary floor run. */
export function kitchenLegClashes(project: InteriorProject, roomId: string): string[] {
  const objects = project.objects.filter((object) => object.roomId === roomId && object.position.y < 100);
  const legs = objects.filter(isLeg);
  const primary = objects.filter((object) => object.kind === "cabinet" && !isLeg(object) && hostWallId(object));
  return legs.filter((leg) => primary.some((other) => {
    const a = footprint(leg);
    const b = footprint(other);
    return a.minX < b.maxX - 1 && b.minX < a.maxX - 1 && a.minZ < b.maxZ - 1 && b.minZ < a.maxZ - 1;
  })).map((leg) => leg.id);
}
