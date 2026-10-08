import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { validateInteriorProject } from "./validation";
import { createWallSegmentResult } from "./wallEditingSegment";
import { movePlanNodeWithOpenings, translatePlanWall } from "./wallEditingMove";
import { resolveWallEndpoint, wallSpanHit, weldNodeIntoWalls } from "./wallEditingWeld";
import { createWallGraphIndex } from "./wallGraph";

const NOW = "2026-10-08T00:00:00.000Z";

function degreeAt(project: ReturnType<typeof createLivingRoomStarterProject>, x: number, z: number) {
  const index = createWallGraphIndex(project);
  const node = project.nodes.find((item) => Math.hypot(item.position.x - x, item.position.z - z) < 0.5);
  return node ? (index.incidentWallIdsByNode.get(node.id)?.length ?? 0) : 0;
}

function errors(project: ReturnType<typeof createLivingRoomStarterProject>) {
  return validateInteriorProject(project).issues.filter((issue) => issue.severity === "error");
}

/** The starter room is a 6200 × 4600 rectangle centred on the origin (corners at ±3100, ±2300). */
describe("commit-time weld and T-junction (roadmap S4)", () => {
  it("finds a wall span away from its ends, never at a node", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const hit = wallSpanHit(project, { x: 0, z: 2300.4 }, 1);
    expect(hit?.wall.start.z === 2300 && hit.wall.end.z === 2300).toBe(true);
    expect(Math.abs(hit!.offsetMm - 3100)).toBeLessThan(1);
    expect(wallSpanHit(project, { x: 3100, z: 2300 }, 1)).toBeNull();
    expect(wallSpanHit(project, { x: 0, z: 2310 }, 1)).toBeNull();
  });

  it("resolves an endpoint onto a node, or splits the wall it lands on", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const corner = resolveWallEndpoint(project, { x: 3100.3, z: -2299.8 });
    expect(corner.nodeId).toBeTruthy();
    expect(corner.point).toEqual({ x: 3100, z: -2300 });
    expect(corner.project).toBe(project);
    const span = resolveWallEndpoint(project, { x: 0, z: 2300 });
    expect(span.nodeId).toBeTruthy();
    expect(span.project.walls).toHaveLength(project.walls.length + 1);
    expect(degreeAt(span.project, 0, 2300)).toBe(2);
    const free = resolveWallEndpoint(project, { x: 0, z: 0 });
    expect(free.project).toBe(project);
    expect(free.nodeId).toBeNull();
  });

  it("a partition ending on a room wall splits that wall into a degree-3 node", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: next, wallId } = createWallSegmentResult(project, {
      start: { x: 0, z: 0 }, end: { x: 0, z: 2300 }, kind: "partition", raised: true,
    });
    expect(wallId).toBeTruthy();
    expect(next.walls).toHaveLength(project.walls.length + 2);
    expect(degreeAt(next, 0, 2300)).toBe(3);
    expect(next.rooms).toHaveLength(project.rooms.length);
    const loop = next.loops.find((item) => item.id === next.rooms[0]!.outerLoopId)!;
    expect(loop.wallUses).toHaveLength(5);
    expect(errors(next)).toEqual([]);
  });

  it("a wall drawn between two room walls still splits the room, through the welded nodes", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: next } = createWallSegmentResult(project, {
      start: { x: 0, z: -2300 }, end: { x: 0, z: 2300 }, raised: true,
    });
    expect(next.rooms).toHaveLength(project.rooms.length + 1);
    expect(degreeAt(next, 0, 2300)).toBe(3);
    expect(degreeAt(next, 0, -2300)).toBe(3);
    expect(errors(next)).toEqual([]);
  });

  it("a free wall ending a hair off a node welds to it", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: next } = createWallSegmentResult(project, {
      start: { x: 3100.4, z: -2300.3 }, end: { x: 5000, z: -2300 }, raised: true,
    });
    expect(next.nodes).toHaveLength(project.nodes.length + 1);
    expect(degreeAt(next, 3100, -2300)).toBe(3);
  });

  it("dragging a free node onto a wall span splits it and joins", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: withPartition, wallId } = createWallSegmentResult(project, {
      start: { x: 0, z: -1000 }, end: { x: 0, z: 1000 }, kind: "partition", raised: true,
    });
    const partition = withPartition.walls.find((wall) => wall.id === wallId)!;
    const moved = movePlanNodeWithOpenings(withPartition, partition.endNodeId!, { x: 0, z: 2300 });
    expect(moved.walls).toHaveLength(withPartition.walls.length + 1);
    expect(degreeAt(moved, 0, 2300)).toBe(3);
    expect(moved.nodes.find((node) => node.id === partition.endNodeId)?.position).toEqual({ x: 0, z: 2300 });
    expect(errors(moved)).toEqual([]);
  });

  it("dragging a free node within a millimetre of a corner joins them", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: withPartition, wallId } = createWallSegmentResult(project, {
      start: { x: 0, z: -1000 }, end: { x: 1500, z: -1000 }, kind: "partition", raised: true,
    });
    const partition = withPartition.walls.find((wall) => wall.id === wallId)!;
    const moved = movePlanNodeWithOpenings(withPartition, partition.endNodeId!, { x: 3099.6, z: -2300.4 });
    expect(moved.nodes).toHaveLength(withPartition.nodes.length - 1);
    expect(degreeAt(moved, 3100, -2300)).toBe(3);
  });

  it("translating a partition onto a wall welds both ends", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: withPartition, wallId } = createWallSegmentResult(project, {
      start: { x: -1000, z: 0 }, end: { x: 1000, z: 0 }, kind: "partition", raised: true,
    });
    const moved = translatePlanWall(withPartition, wallId!, { x: 0, z: 2300 });
    expect(moved.walls.length).toBeGreaterThanOrEqual(withPartition.walls.length + 1);
    expect(degreeAt(moved, -1000, 2300)).toBe(3);
    expect(degreeAt(moved, 1000, 2300)).toBe(3);
  });

  it("does nothing for a node that sits on nothing", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const { project: withPartition, wallId } = createWallSegmentResult(project, {
      start: { x: 0, z: -1000 }, end: { x: 0, z: 1000 }, kind: "partition", raised: true,
    });
    const partition = withPartition.walls.find((wall) => wall.id === wallId)!;
    expect(weldNodeIntoWalls(withPartition, partition.endNodeId!)).toBe(withPartition);
  });
});
