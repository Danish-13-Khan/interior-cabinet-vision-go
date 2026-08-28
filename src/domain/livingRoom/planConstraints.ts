import type { InteriorProject, OpeningEntity, Point2Mm, WallEntity } from "../interiorProject";
import { pointInPolygon, polygonsIntersect, selectRoomOpenings, selectRoomWalls } from "../interiorProject";
import {
  boundsOverlap,
  getObjectPlanCorners,
  getObjectPlanBounds,
  objectFitsRoom,
} from "./planGeometry";

export type LivingRoomPlanIssue = {
  code: "outside-room" | "overlap" | "opening-clearance" | "circulation";
  severity: "error" | "warning";
  objectIds: string[];
  message: string;
};

export function isBlockingLivingRoomPlanIssue(issue: LivingRoomPlanIssue) {
  return issue.severity === "error";
}

// Surface-mounted treatment is part of the wall, not a circulation obstacle.
const NON_BLOCKING_CATEGORIES = new Set([
  "rug", "mirror", "feature-wall", "display-niche", "accessory", "ceiling-fixture", "window-treatment", "filler",
]);

function openingZone(opening: OpeningEntity, wall: WallEntity): Point2Mm[] {
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
  const nx = -uz;
  const nz = ux;
  const depth = clearance + 80;
  return [
    { x: startX + nx * depth, z: startZ + nz * depth },
    { x: endX + nx * depth, z: endZ + nz * depth },
    { x: endX - nx * depth, z: endZ - nz * depth },
    { x: startX - nx * depth, z: startZ - nz * depth },
  ];
}

function footprintsOverlap(first: ReturnType<typeof getObjectPlanCorners>, second: ReturnType<typeof getObjectPlanCorners>) {
  return polygonsIntersect(first, second)
    || first.some((point) => pointInPolygon(point, second))
    || second.some((point) => pointInPolygon(point, first));
}

function pointToSegmentDistance(point: Point2Mm, start: Point2Mm, end: Point2Mm) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;
  if (!lengthSq) return Math.hypot(point.x - start.x, point.z - start.z);
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq));
  return Math.hypot(point.x - (start.x + dx * ratio), point.z - (start.z + dz * ratio));
}

function footprintDistance(first: ReturnType<typeof getObjectPlanCorners>, second: ReturnType<typeof getObjectPlanCorners>) {
  if (footprintsOverlap(first, second)) return 0;
  const distanceToEdges = (points: Point2Mm[], polygon: Point2Mm[]) => points.flatMap((point) => polygon.map((edgeStart, index) =>
    pointToSegmentDistance(point, edgeStart, polygon[(index + 1) % polygon.length]!),
  ));
  return Math.min(...distanceToEdges(first, second), ...distanceToEdges(second, first));
}

export function inspectLivingRoomPlan(project: InteriorProject): LivingRoomPlanIssue[] {
  const issues: LivingRoomPlanIssue[] = [];
  for (const room of project.rooms) {
    const objects = project.objects.filter((object) => object.roomId === room.id);
    const blocking = objects.filter(
      (object) => !NON_BLOCKING_CATEGORIES.has(object.category),
    );

    for (const object of blocking) {
      if (!objectFitsRoom(project, object)) {
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
        // AABBs are a cheap rejection test; the final check uses the actual
        // rotated cabinet/furniture footprints so angled freeform plans do not
        // receive false collision errors.
        if (boundsOverlap(firstBounds, secondBounds) && footprintsOverlap(getObjectPlanCorners(first), getObjectPlanCorners(second))) {
          issues.push({
            code: "overlap",
            severity: "error",
            objectIds: [first.id, second.id],
            message: `${first.name} overlaps ${second.name}.`,
          });
        } else {
          const clearance = footprintDistance(getObjectPlanCorners(first), getObjectPlanCorners(second));
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

    const walls = selectRoomWalls(project, room.id);
    for (const opening of selectRoomOpenings(project, room.id)) {
      const wall = walls.find((item) => item.id === opening.wallId);
      if (!wall) continue;
      const zone = openingZone(opening, wall);
      for (const object of blocking) {
        const objectBounds = getObjectPlanBounds(object);
        const zoneBounds = {
          minX: Math.min(...zone.map((point) => point.x)), maxX: Math.max(...zone.map((point) => point.x)),
          minZ: Math.min(...zone.map((point) => point.z)), maxZ: Math.max(...zone.map((point) => point.z)),
        };
        if (!boundsOverlap(objectBounds, zoneBounds) || !footprintsOverlap(getObjectPlanCorners(object), zone)) continue;
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
