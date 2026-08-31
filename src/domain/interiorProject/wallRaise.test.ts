import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { PLAN_TRACE_HEIGHT_MM } from "./authoringStandards";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { compileWallHeightMm, isWallRaised, setPlanWallsRaised } from "./wallRaise";
import { validateInteriorProject } from "./validation";

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

describe("wall raise", () => {
  it("keeps drawn walls as plan traces until they are raised", () => {
    const drawn = blankDrawnRoom();
    expect(drawn.walls.every((wall) => wall.raised === false)).toBe(true);
    expect(drawn.walls.every((wall) => !isWallRaised(wall))).toBe(true);
    expect(compileWallHeightMm(drawn.walls[0]!)).toBe(PLAN_TRACE_HEIGHT_MM);
    const scene = compileLivingRoomScene(drawn);
    const wallHeights = scene.nodes
      .filter((node) => node.metadata.role === "wall")
      .flatMap((node) => node.primitives.map((primitive) => primitive.kind === "box" ? primitive.sizeMm.height : 0));
    expect(wallHeights.every((height) => height === PLAN_TRACE_HEIGHT_MM)).toBe(true);
    expect(scene.nodes.some((node) => node.metadata.surface === "ceiling")).toBe(false);
  });

  it("extrudes selected walls to 3D and then compiles a ceiling", () => {
    const drawn = blankDrawnRoom();
    const wallIds = drawn.walls.map((wall) => wall.id);
    const raised = setPlanWallsRaised(drawn, wallIds, true, 3000);
    expect(raised.walls.every((wall) => isWallRaised(wall) && wall.heightMm === 3000)).toBe(true);
    expect(raised.rooms[0]?.dimensions.heightMm).toBe(3000);
    const scene = compileLivingRoomScene(raised);
    const wallHeights = scene.nodes
      .filter((node) => node.metadata.role === "wall")
      .flatMap((node) => node.primitives.map((primitive) => primitive.kind === "box" ? primitive.sizeMm.height : 0));
    expect(Math.max(...wallHeights)).toBe(3000);
    expect(scene.nodes.some((node) => node.metadata.surface === "ceiling")).toBe(true);
    expect(validateInteriorProject(raised).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("treats template walls without a raised flag as already 3D", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" });
    expect(starter.walls.every((wall) => wall.raised !== false)).toBe(true);
    const scene = compileLivingRoomScene(starter);
    expect(scene.nodes.some((node) => node.metadata.role === "wall" && node.metadata.planTrace === true)).toBe(false);
  });
});
