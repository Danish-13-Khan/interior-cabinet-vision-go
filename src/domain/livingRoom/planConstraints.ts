import type { InteriorProject, OpeningEntity, WallEntity } from "../interiorProject";
import {
  boundsDistance,
  boundsOverlap,
  getObjectPlanBounds,
  getRoomPlanBounds,
  type PlanBounds,
} from "./planGeometry";

export type LivingRoomPlanIssue = {
  code: "outside-room" | "overlap" | "opening-clearance" | "circulation";
  severity: "error" | "warning";
  objectIds: string[];
  message: string;
};

const NON_BLOCKING_CATEGORIES = new Set(["rug", "mirror"]);

function openingZone(opening: OpeningEntity, wall: WallEntity): PlanBounds {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const ux = dx / length;
  const uz = dz / length;
  const startX = wall.start.x + ux * opening.offsetMm;
  const startZ = wall.start.z + uz * opening.offsetMm;
  const endX = startX + ux * opening.widthMm;
  const endZ = startZ + uz * opening.widthMm;
  const clearance = opening.kind === "door" ? opening.widthMm : 250;
  return {
    minX: Math.min(startX, endX) - (Math.abs(uz) * clearance + 80),
    maxX: Math.max(startX, endX) + (Math.abs(uz) * clearance + 80),
    minZ: Math.min(startZ, endZ) - (Math.abs(ux) * clearance + 80),
    maxZ: Math.max(startZ, endZ) + (Math.abs(ux) * clearance + 80),
  };
}

export function inspectLivingRoomPlan(project: InteriorProject): LivingRoomPlanIssue[] {
  const issues: LivingRoomPlanIssue[] = [];
  for (const room of project.rooms) {
    const roomBounds = getRoomPlanBounds(room);
    const objects = project.objects.filter((object) => object.roomId === room.id);
    const blocking = objects.filter(
      (object) => !NON_BLOCKING_CATEGORIES.has(object.category),
    );

    for (const object of blocking) {
      const bounds = getObjectPlanBounds(object);
      if (
        bounds.minX < roomBounds.minX ||
        bounds.maxX > roomBounds.maxX ||
        bounds.minZ < roomBounds.minZ ||
        bounds.maxZ > roomBounds.maxZ
      ) {
        issues.push({
          code: "outside-room",
          severity: "error",
          objectIds: [object.id],
          message: `${object.name} extends outside the room boundary.`,
        });
      }
    }

    for (let index = 0; index < blocking.length; index += 1) {
      for (let next = index + 1; next < blocking.length; next += 1) {
        const first = blocking[index]!;
        const second = blocking[next]!;
        const firstBounds = getObjectPlanBounds(first);
        const secondBounds = getObjectPlanBounds(second);
        if (boundsOverlap(firstBounds, secondBounds)) {
          issues.push({
            code: "overlap",
            severity: "error",
            objectIds: [first.id, second.id],
            message: `${first.name} overlaps ${second.name}.`,
          });
        } else {
          const clearance = boundsDistance(firstBounds, secondBounds);
          if (clearance > 0 && clearance < 350) {
            issues.push({
              code: "circulation",
              severity: "warning",
              objectIds: [first.id, second.id],
              message: `${first.name} and ${second.name} have only ${Math.round(clearance)} mm clearance.`,
            });
          }
        }
      }
    }

    const walls = project.walls.filter((wall) => wall.roomId === room.id);
    for (const opening of project.openings.filter((item) => item.roomId === room.id)) {
      const wall = walls.find((item) => item.id === opening.wallId);
      if (!wall) continue;
      const zone = openingZone(opening, wall);
      for (const object of blocking) {
        if (!boundsOverlap(getObjectPlanBounds(object), zone)) continue;
        if (opening.kind === "window" && object.dimensions.heightMm < opening.sillHeightMm) {
          continue;
        }
        issues.push({
          code: "opening-clearance",
          severity: "warning",
          objectIds: [object.id],
          message: `${object.name} obstructs the ${opening.kind} clearance zone.`,
        });
      }
    }
  }
  return issues;
}

