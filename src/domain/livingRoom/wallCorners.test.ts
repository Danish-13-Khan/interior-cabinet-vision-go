import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, rectanglePoints } from "../interiorProject/roomDrawing";
import { createWallGraphIndex } from "../interiorProject/wallGraph";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import { createLivingRoomStarterProject } from "./preset";
import { compileLivingRoomScene } from "./sceneCompiler";
import { wallCornerExtensionMm } from "./sceneCompilerRoom";

const NOW = "2026-10-08T00:00:00.000Z";

function rectangularRoom() {
  const blank = applyPlannerStarterTemplate(createLivingRoomStarterProject({ now: NOW }), "blank-room");
  return drawRoomFromPoints(blank, { kind: "rectangle", points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }) });
}

describe("3D wall corner joins (roadmap S9)", () => {
  it("extends each wall by half its thickness at a right-angle corner", () => {
    const project = rectangularRoom();
    const index = createWallGraphIndex(project);
    for (const wall of project.walls) {
      expect(wallCornerExtensionMm(index, wall, wall.startNodeId)).toBeCloseTo(wall.thicknessMm / 2, 6);
      expect(wallCornerExtensionMm(index, wall, wall.endNodeId)).toBeCloseTo(wall.thicknessMm / 2, 6);
    }
  });

  it("compiles the room's wall boxes longer than their centrelines by one thickness", () => {
    const project = rectangularRoom();
    const scene = compileLivingRoomScene(project);
    const boxes = scene.nodes
      .filter((node) => node.metadata.role === "wall")
      .map((node) => node.primitives[0])
      .filter((primitive): primitive is Extract<typeof primitive, { kind: "box" }> => primitive?.kind === "box")
      .map((box) => box.sizeMm.width)
      .sort((a, b) => a - b);
    const thickness = project.walls[0]!.thicknessMm;
    expect(boxes).toEqual([3000 + thickness, 3000 + thickness, 4000 + thickness, 4000 + thickness]);
  });

  it("does not extend a straight continuation, a free end, or a three-wall node", () => {
    const project = rectangularRoom();
    const horizontal = project.walls.filter((wall) => Math.abs(wall.start.z - wall.end.z) < 1);
    const first = horizontal.sort((a, b) => a.start.z - b.start.z)[0]!;
    const beyond = { x: first.end.x + (first.end.x - first.start.x), z: first.end.z };
    // A node with one wall: no partner, no extension.
    const lone = { ...project, walls: [first] };
    expect(wallCornerExtensionMm(createWallGraphIndex(lone), first, first.endNodeId)).toBe(0);
    // Collinear partner: the angle is 180°, so the extension is zero.
    const straight = {
      ...project,
      nodes: [...project.nodes, { id: "far", position: beyond }],
      walls: [first, { ...first, id: "continuation", start: { ...first.end }, end: beyond, startNodeId: first.endNodeId, endNodeId: "far" }],
    };
    expect(wallCornerExtensionMm(createWallGraphIndex(straight), first, first.endNodeId)).toBe(0);
    // Degree three keeps today's overlap.
    const out = { x: first.end.x, z: first.end.z - 2000 };
    const tee = {
      ...project,
      nodes: [...project.nodes, { id: "out", position: out }],
      walls: [...project.walls, { ...first, id: "tee", start: { ...first.end }, end: out, startNodeId: first.endNodeId, endNodeId: "out" }],
    };
    expect(wallCornerExtensionMm(createWallGraphIndex(tee), first, first.endNodeId)).toBe(0);
  });
});
