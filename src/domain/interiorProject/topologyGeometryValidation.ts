import {
  pointInPolygon,
  polygonSelfIntersects,
  polygonSignedArea,
  polygonsIntersect,
  roomPlanPolygon,
} from "./roomGeometry";
import type { InteriorProject, InteriorValidationIssue } from "./types";

function issue(
  issues: InteriorValidationIssue[],
  value: Omit<InteriorValidationIssue, "repaired">,
) {
  issues.push({ ...value, repaired: false });
}

export function validateTopologyGeometry(
  project: InteriorProject,
  issues: InteriorValidationIssue[],
) {
  for (const room of project.rooms) {
    const polygon = roomPlanPolygon(project, room.id);
    if (!polygon) continue;
    if (Math.abs(polygonSignedArea(polygon.outer)) < 10_000) {
      issue(issues, {
        severity: "error", code: "room-loop-zero-area",
        path: `rooms.${room.id}.outerLoopId`, message: "Room boundary needs a usable enclosed area.",
      });
    }
    if (polygonSelfIntersects(polygon.outer)) {
      issue(issues, {
        severity: "error",
        code: "room-loop-self-intersection",
        path: `rooms.${room.id}.outerLoopId`,
        message: "Room boundary must not cross itself.",
      });
    }
    for (const [index, hole] of polygon.holes.entries()) {
      if (Math.abs(polygonSignedArea(hole)) < 10_000) {
        issue(issues, {
          severity: "error", code: "room-hole-zero-area",
          path: `rooms.${room.id}.holeLoopIds[${index}]`,
          message: "Room holes need a usable enclosed area.",
        });
      }
      if (polygonSelfIntersects(hole)) {
        issue(issues, {
          severity: "error", code: "room-hole-self-intersection",
          path: `rooms.${room.id}.holeLoopIds[${index}]`,
          message: "Room hole boundary must not cross itself.",
        });
      }
    }
    for (const [index, hole] of polygon.holes.entries()) {
      if (hole.some((point) => !pointInPolygon(point, polygon.outer))
        || polygonsIntersect(polygon.outer, hole)) {
        issue(issues, {
          severity: "error", code: "room-hole-outside-boundary",
          path: `rooms.${room.id}.holeLoopIds[${index}]`,
          message: "Room holes must stay fully inside the outer boundary.",
        });
      }
      for (let other = index + 1; other < polygon.holes.length; other += 1) {
        const next = polygon.holes[other]!;
        if (!polygonsIntersect(hole, next)
          && !pointInPolygon(hole[0]!, next) && !pointInPolygon(next[0]!, hole)) continue;
        issue(issues, {
          severity: "error", code: "room-holes-overlap",
          path: `rooms.${room.id}.holeLoopIds[${other}]`,
          message: "Room holes must not overlap.",
        });
      }
    }
    for (const kind of ["floor", "ceiling"] as const) {
      const surface = project.surfaces.find((item) => item.roomId === room.id && item.kind === kind);
      if (surface && surface.loopId === room.outerLoopId
        && (surface.polygon?.length ?? 0) >= 3) continue;
      issue(issues, {
        severity: "warning",
        code: `room-${kind}-surface-missing`,
        path: `rooms.${room.id}`,
        message: `Room needs a ${kind} surface derived from its closed outer loop.`,
      });
    }
  }
}
