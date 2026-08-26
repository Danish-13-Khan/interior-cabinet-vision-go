import {
  buildContiguousWallUses,
  isLoopContiguous,
  loopSignedArea,
  pointKey,
  roomIdsUsingWall,
  wallLengthMm,
} from "./planTopology";
import type {
  InteriorProject,
  InteriorValidationIssue,
  OpeningEntity,
  PlanLoop,
  PlanNodeEntity,
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
  if (!needsNodes && !needsLoops && project.nodes.length > 0) return project;

  const nodeByPoint = new Map<string, string>();
  const nodes: PlanNodeEntity[] = [...project.nodes];
  for (const node of nodes) nodeByPoint.set(pointKey(node.position), node.id);
  const nodeIdFor = (point: { x: number; z: number }) => {
    const key = pointKey(point);
    const found = nodeByPoint.get(key);
    if (found) return found;
    const id = `compat-node-${nodeByPoint.size + 1}`;
    nodeByPoint.set(key, id);
    nodes.push({ id, position: { ...point } });
    return id;
  };

  const walls = project.walls.map((wall) => ({
    ...wall,
    startNodeId: wall.startNodeId ?? nodeIdFor(wall.start),
    endNodeId: wall.endNodeId ?? nodeIdFor(wall.end),
  }));

  const loops: PlanLoop[] = [...project.loops];
  const rooms = project.rooms.map((room) => {
    if (room.outerLoopId && loops.some((loop) => loop.id === room.outerLoopId)) return room;
    const loopId = `${room.id}:outer-loop`;
    const roomWalls = walls.filter((wall) => wall.roomId === room.id);
    loops.push({
      id: loopId,
      wallUses: buildContiguousWallUses(roomWalls),
      extensions: { synthesizedBy: "compat-topology" },
    });
    return { ...room, outerLoopId: loopId, holeLoopIds: room.holeLoopIds ?? [] };
  });

  // Silent repair: rectangular presets stay issue-free while gaining graph fields.
  void issues;
  return { ...project, nodes, walls, loops, rooms };
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

  validateOpenings(project.openings, wallsById, issues);
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

function validateOpenings(
  openings: OpeningEntity[],
  wallsById: Map<string, WallEntity>,
  issues: InteriorValidationIssue[],
) {
  const byWall = new Map<string, OpeningEntity[]>();
  for (const opening of openings) {
    const wall = wallsById.get(opening.wallId);
    if (!wall) {
      pushIssue(issues, {
        severity: "error",
        code: "opening-unknown-wall",
        path: `openings.${opening.id}`,
        message: "Opening references an unknown wall.",
      });
      continue;
    }
    const length = wallLengthMm(wall);
    if (opening.offsetMm < 0 || opening.offsetMm + opening.widthMm > length + 0.5) {
      pushIssue(issues, {
        severity: "warning",
        code: "opening-out-of-range",
        path: `openings.${opening.id}`,
        message: "Opening extent should lie within the host wall length.",
      });
    }
    const list = byWall.get(opening.wallId) ?? [];
    list.push(opening);
    byWall.set(opening.wallId, list);
  }
  for (const [wallId, list] of byWall) {
    const sorted = [...list].sort((a, b) => a.offsetMm - b.offsetMm);
    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1]!;
      const next = sorted[index]!;
      if (prev.offsetMm + prev.widthMm > next.offsetMm + 0.5) {
        pushIssue(issues, {
          severity: "warning",
          code: "opening-overlap",
          path: `openings.${next.id}`,
          message: `Opening overlaps another opening on wall ${wallId}.`,
        });
      }
    }
  }
}
