import { describe, expect, it } from "vitest";
import {
  applyPlannerStarterTemplate,
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  inspectLivingRoomPlan,
  resizeLivingRoom,
  snapLivingRoomObject,
} from "../livingRoom";
import { createInteriorTechnicalPlanSvg } from "./interiorTechnicalPlan";
import { drawRoomFromPoints } from "./roomDrawing";
import { roomPlanViewBounds } from "./roomPlanBounds";
import { validateInteriorProject } from "./validation";
import type { Point2Mm } from "./types";

const NOW = "2026-08-27T00:00:00.000Z";
const L_SHAPE = [
  { x: 0, z: 0 }, { x: 4000, z: 0 }, { x: 4000, z: 1500 },
  { x: 1500, z: 1500 }, { x: 1500, z: 4000 }, { x: 0, z: 4000 },
];

function lRoomProject() {
  const blank = applyPlannerStarterTemplate(
    createLivingRoomStarterProject({ now: NOW }),
    "blank-room",
  );
  return drawRoomFromPoints(blank, {
    kind: "polygon",
    points: L_SHAPE,
  });
}

describe("D4 closed-loop room geometry", () => {
  it("derives floor and ceiling zones and compiles polygon prisms", () => {
    const project = lRoomProject();
    const roomId = project.activeRoomId;
    const surfaces = project.surfaces.filter((surface) => surface.roomId === roomId);
    const scene = compileLivingRoomScene(project);
    const floor = scene.nodes.find((node) => node.id === `room-floor:${roomId}`);

    expect(surfaces.map((surface) => surface.kind).sort()).toEqual(["ceiling", "floor"]);
    expect(surfaces.every((surface) => surface.polygon?.length === 6)).toBe(true);
    expect(floor?.primitives[0]).toMatchObject({ kind: "polygon-prism" });
    expect(floor?.primitives[0]?.kind === "polygon-prism"
      ? floor.primitives[0].outlineMm : []).toHaveLength(6);
  });

  it("uses graph bounds and the freeform outline in technical-plan SVG", () => {
    const project = lRoomProject();
    const bounds = roomPlanViewBounds(project, project.activeRoomId);
    const svg = createInteriorTechnicalPlanSvg(project, { width: 600, height: 400 });

    expect(bounds).toMatchObject({ widthMm: 4000, depthMm: 4000 });
    expect(svg).toContain('class="interior-technical-plan"');
    expect(svg).toContain('class="plan-floor"');
    expect(svg.match(/ L/g)?.length).toBeGreaterThanOrEqual(5);
    expect(svg).toContain("4000 mm");
  });

  it("resizes freeform graph nodes and refreshes derived caches and surfaces", () => {
    const project = lRoomProject();
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const resized = resizeLivingRoom(project, room.id, {
      widthMm: 5000, depthMm: 3000, heightMm: 3100,
    });
    const bounds = roomPlanViewBounds(resized, room.id);
    const nextRoom = resized.rooms.find((item) => item.id === room.id)!;
    const floor = resized.surfaces.find((surface) =>
      surface.roomId === room.id && surface.kind === "floor");

    expect(bounds).toMatchObject({ widthMm: 5000, depthMm: 3000 });
    expect(nextRoom.dimensions).toEqual({ widthMm: 5000, depthMm: 3000, heightMm: 3100 });
    expect(floor?.polygon).toHaveLength(6);
  });

  it("flags furniture placed in an L-room cutout", () => {
    const project = lRoomProject();
    const source = createLivingRoomStarterProject({ now: NOW }).objects[0]!;
    const object = {
      ...source,
      id: "cutout-object",
      roomId: project.activeRoomId,
      kind: "furniture" as const,
      category: "sofa",
      position: { x: 1000, y: 0, z: 1000 },
      dimensions: { widthMm: 400, heightMm: 700, depthMm: 400 },
    };
    const inspected = { ...project, objects: [...project.objects, object] };

    expect(inspectLivingRoomPlan(inspected)).toContainEqual(expect.objectContaining({
      code: "outside-room",
      objectIds: [object.id],
    }));
  });

  it("snaps against arbitrary loop walls and reports wall guides", () => {
    const starter = createLivingRoomStarterProject({ now: NOW });
    const blank = applyPlannerStarterTemplate(starter, "blank-room");
    const project = drawRoomFromPoints(blank, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 3600, z: 600 }, { x: 3000, z: 2800 }, { x: 0, z: 2400 }],
    });
    const source = starter.objects[0]!;
    const object = {
      ...source,
      id: "snap-object",
      roomId: project.activeRoomId,
      dimensions: { widthMm: 400, heightMm: 700, depthMm: 400 },
    };
    const withObject = { ...project, objects: [...project.objects, object] };
    const desired = { x: 0, y: 0, z: -800 };
    const result = snapLivingRoomObject(withObject, object.id, desired, 50);

    expect(result.guides.some((guide) => guide.kind === "wall")).toBe(true);
    expect(result.position).not.toEqual(desired);
  });

  it("rejects a self-crossing room boundary", () => {
    const project = drawRoomFromPoints(createLivingRoomStarterProject({ now: NOW }), {
      kind: "rectangle",
      points: [{ x: 0, z: 0 }, { x: 3000, z: 2200 }],
    });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const loop = project.loops.find((item) => item.id === room.outerLoopId)!;
    const nodeIds = loop.wallUses.map((use) => {
      const wall = project.walls.find((item) => item.id === use.wallId)!;
      return use.direction === "forward" ? wall.startNodeId! : wall.endNodeId!;
    });
    const crossed: Point2Mm[] = [
      { x: -1500, z: -1100 }, { x: 1500, z: 1100 },
      { x: 1500, z: -1100 }, { x: -1500, z: 1100 },
    ];
    const nodes = project.nodes.map((node) => {
      const index = nodeIds.indexOf(node.id);
      return index < 0 ? node : { ...node, position: crossed[index]! };
    });
    const result = validateInteriorProject({ ...project, nodes });

    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: "error",
      code: "room-loop-self-intersection",
    }));
  });
});
