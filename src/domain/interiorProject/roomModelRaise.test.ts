import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { planClosedRoomModelRaise, raiseClosedRoomForModel } from "./roomModelRaise";
import { isWallRaised, outerLoopWallsRaised, setPlanWallsRaised } from "./wallRaise";

function blankDrawnRoom() {
  const blank = applyPlannerStarterTemplate(
    createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" }),
    "blank-room",
  );
  return drawRoomFromPoints(blank, {
    kind: "rectangle",
    points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
  });
}

describe("planClosedRoomModelRaise", () => {
  it("raises a valid closed room once and then reports ready", () => {
    const drawn = blankDrawnRoom();
    const plan = planClosedRoomModelRaise(drawn);
    expect(plan.status).toBe("raise");
    const raised = raiseClosedRoomForModel(drawn);
    expect(raised).not.toBeNull();
    expect(raised!.walls.every((wall) => isWallRaised(wall))).toBe(true);
    expect(planClosedRoomModelRaise(raised!).status).toBe("ready");
    expect(raiseClosedRoomForModel(raised!)).toBeNull();
    const scene = compileLivingRoomScene(raised!);
    expect(scene.bounds.size.heightMm).toBeGreaterThan(400);
    expect(scene.nodes.some((node) => node.metadata.surface === "ceiling")).toBe(true);
  });

  it("leaves template rooms that are already 3D unchanged", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" });
    expect(planClosedRoomModelRaise(starter).status).toBe("ready");
    expect(raiseClosedRoomForModel(starter)).toBeNull();
  });

  it("blocks an open outline without mutating it", () => {
    const drawn = blankDrawnRoom();
    const room = drawn.rooms[0]!;
    const loop = drawn.loops.find((item) => item.id === room.outerLoopId)!;
    const open = {
      ...drawn,
      loops: drawn.loops.map((item) => (
        item.id === loop.id ? { ...item, wallUses: item.wallUses.slice(0, 2) } : item
      )),
    };
    const plan = planClosedRoomModelRaise(open);
    expect(plan.status).toBe("blocked");
    if (plan.status === "blocked") {
      expect(plan.reason).toMatch(/open or invalid/i);
    }
    expect(raiseClosedRoomForModel(open)).toBeNull();
  });

  it("raises a hidden boundary wall before the room is ready", () => {
    const drawn = blankDrawnRoom();
    const room = drawn.rooms[0]!;
    const loop = drawn.loops.find((item) => item.id === room.outerLoopId)!;
    const hiddenId = loop.wallUses[0]!.wallId;
    const others = loop.wallUses.slice(1).map((use) => use.wallId);
    const partial = setPlanWallsRaised(drawn, others, true, room.dimensions.heightMm);
    const hidden = {
      ...partial,
      walls: partial.walls.map((wall) => (
        wall.id === hiddenId ? { ...wall, visible: false, raised: false as const } : wall
      )),
    };
    const plan = planClosedRoomModelRaise(hidden);
    expect(plan.status).toBe("raise");
    if (plan.status === "raise") expect(plan.wallIds).toContain(hiddenId);
    const raised = raiseClosedRoomForModel(hidden);
    expect(raised).not.toBeNull();
    const hiddenWall = raised!.walls.find((wall) => wall.id === hiddenId)!;
    expect(hiddenWall.visible).toBe(false);
    expect(isWallRaised(hiddenWall)).toBe(true);
    expect(outerLoopWallsRaised(raised!, raised!.rooms[0]!)).toBe(true);
    expect(planClosedRoomModelRaise(raised!).status).toBe("ready");
  });
});
