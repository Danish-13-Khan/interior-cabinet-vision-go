import {
  isLoopContiguous,
  loopSignedArea,
  roomIdsUsingWall,
} from "./planTopology";
import { migrateBoxRoomsToWallGraph, WALL_GRAPH_DOMAIN_VERSION } from "./boxRoomGraphMigration";
import { synchronizeWallCaches } from "./wallGraph";
import { validateTopologyOpenings } from "./topologyOpeningValidation";
import { validateTopologyGeometry } from "./topologyGeometryValidation";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type {
  InteriorProject,
  InteriorValidationIssue,
  PlanLoop,
  WallEntity,
} from "./types";

function pushIssue(
  issues: InteriorValidationIssue[],
  issue: Omit<InteriorValidationIssue, "repaired"> & { repaired?: boolean },
) {
  issues.push({ repaired: false, ...issue });
}

/** Synthesize graph endpoints/loops for rectangular documents that still lack them. */
export function ensureCompatPlanTopology(
  project: InteriorProject,
  issues: InteriorValidationIssue[],
): InteriorProject {
  const needsNodes = project.walls.some((wall) => !wall.startNodeId || !wall.endNodeId);
  const needsLoops = project.rooms.some((room) => !room.outerLoopId);
  void issues;
  if (!needsNodes && !needsLoops && project.nodes.length > 0) {
    if (project.extensions?.wallGraphDomainVersion === WALL_GRAPH_DOMAIN_VERSION) {
      return synchronizeRoomSurfaceZones(synchronizeWallCaches(project));
    }
    const graphNative = project.walls.some((wall) => wall.roomId == null)
      || project.walls.some((wall) => roomIdsUsingWall(project, wall.id).length > 1);
    if (graphNative) {
      return synchronizeRoomSurfaceZones(synchronizeWallCaches({
        ...project,
        extensions: { ...project.extensions, wallGraphDomainVersion: WALL_GRAPH_DOMAIN_VERSION },
      }));
    }
  }
  return synchronizeRoomSurfaceZones(migrateBoxRoomsToWallGraph(project));
}

/** ADR graph/loop/opening checks for schema v2 documents. */
export function validatePlanTopology(
  project: InteriorProject,
  issues: InteriorValidationIssue[],
): void {
  const nodesById = new Map(project.nodes.map((node) => [node.id, node]));
  const wallsById = new Map(project.walls.map((wall) => [wall.id, wall]));
  const loopsById = new Map(project.loops.map((loop) => [loop.id, loop]));

  for (const wall of project.walls) {
    if (!wall.startNodeId || !wall.endNodeId) {
      pushIssue(issues, {
        severity: "warning",
        code: "wall-missing-nodes",
        path: `walls.${wall.id}`,
        message: "Wall is missing graph endpoints; rectangular cache coordinates will be used.",
      });
      continue;
    }
    if (wall.startNodeId === wall.endNodeId) {
      pushIssue(issues, {
        severity: "error",
        code: "wall-degenerate",
        path: `walls.${wall.id}`,
        message: "Wall start and end nodes must be distinct.",
      });
    }
    if (!nodesById.has(wall.startNodeId) || !nodesById.has(wall.endNodeId)) {
      pushIssue(issues, {
        severity: "error",
        code: "wall-unknown-node",
        path: `walls.${wall.id}`,
        message: "Wall references an unknown graph node.",
      });
    }
    const rooms = roomIdsUsingWall(project, wall.id);
    if (rooms.length > 2) {
      pushIssue(issues, {
        severity: "error",
        code: "wall-overshared",
        path: `walls.${wall.id}`,
        message: "A wall may belong to at most two room boundaries.",
      });
    }
    if (rooms.length === 2) {
      const directions = new Set<string>();
      for (const roomId of rooms) {
        const room = project.rooms.find((item) => item.id === roomId);
        const loopIds = [room?.outerLoopId, ...(room?.holeLoopIds ?? [])].filter(Boolean);
        for (const loopId of loopIds) {
          const loop = loopsById.get(String(loopId));
          const use = loop?.wallUses.find((item) => item.wallId === wall.id);
          if (use) directions.add(use.direction);
        }
      }
      if (directions.size < 2) {
        pushIssue(issues, {
          severity: "warning",
          code: "shared-wall-same-direction",
          path: `walls.${wall.id}`,
          message: "Shared wall should be used in opposite directions by adjacent rooms.",
        });
      }
    }
  }

  for (const loop of project.loops) {
    validateLoop(loop, wallsById, issues);
  }

  for (const room of project.rooms) {
    if (!room.outerLoopId || !loopsById.has(room.outerLoopId)) {
      pushIssue(issues, {
        severity: "warning",
        code: "room-missing-outer-loop",
        path: `rooms.${room.id}.outerLoopId`,
        message: "Room is missing a valid outer loop.",
      });
      continue;
    }
    const outer = loopsById.get(room.outerLoopId)!;
    const outerArea = loopSignedArea(outer, wallsById, nodesById);
    if (outerArea < 0) {
      pushIssue(issues, {
        severity: "warning",
        code: "outer-loop-winding",
        path: `loops.${outer.id}`,
        message: "Outer loops should wind with the interior on the left in plan coordinates.",
      });
    }
    for (const holeId of room.holeLoopIds ?? []) {
      const hole = loopsById.get(holeId);
      if (!hole) continue;
      const holeArea = loopSignedArea(hole, wallsById, nodesById);
      if (holeArea > 0) {
        pushIssue(issues, {
          severity: "warning",
          code: "hole-loop-winding",
          path: `loops.${hole.id}`,
          message: "Hole loops should wind opposite the outer loop.",
        });
      }
    }
  }

  validateTopologyOpenings(project.openings, wallsById, issues);
  validateTopologyGeometry(project, issues);
}

function validateLoop(
  loop: PlanLoop,
  wallsById: Map<string, WallEntity>,
  issues: InteriorValidationIssue[],
) {
  if (loop.wallUses.length < 3) {
    pushIssue(issues, {
      severity: "error",
      code: "loop-too-short",
      path: `loops.${loop.id}`,
      message: "A loop needs at least three wall uses.",
    });
    return;
  }
  if (!isLoopContiguous(loop, wallsById)) {
    pushIssue(issues, {
      severity: "error",
      code: "loop-not-closed",
      path: `loops.${loop.id}`,
      message: "Loop wall uses must be contiguous, closed, and unique.",
    });
  }
}
