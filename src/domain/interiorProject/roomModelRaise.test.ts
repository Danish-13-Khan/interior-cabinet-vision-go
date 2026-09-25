import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { planClosedRoomModelRaise, raiseClosedRoomForModel } from "./roomModelRaise";
import { isWallRaised } from "./wallRaise";

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
});
