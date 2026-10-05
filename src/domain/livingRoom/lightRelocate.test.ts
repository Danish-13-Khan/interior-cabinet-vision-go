import { describe, expect, it } from "vitest";
import { compileLivingRoomScene } from "./sceneCompiler";
import { createLivingRoomStarterProject } from "./preset";
import { relocateLight } from "./lightRelocate";
import { addRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";

const NOW = "2026-10-05T00:00:00.000Z";

function withLight(kind: "rope" | "panel", fit = false) {
  const source = createLivingRoomStarterProject({ now: NOW });
  const wall = source.walls.find((item) => item.extensions?.wallSide === "back")!;
  let project = addRoomLightFixture(source, kind, kind === "panel" ? { kind: "ceiling" } : { kind: "wall", wallId: wall.id });
  const id = project.lights.at(-1)!.id;
  if (kind === "rope") project = updateRoomLightFixture(project, id, { parameters: { fitHostWidth: fit } });
  return { project, id, wall };
}

describe("relocateLight", () => {
  it("turns a point on the wall into along and centre height, and stays wall-mounted", () => {
    const { project, id, wall } = withLight("rope");
    const before = project.lights.find((item) => item.id === id)!;
    const moved = relocateLight(project, id, { x: before.position.x + 400, y: 1900, z: before.position.z });
    const after = moved.lights.find((item) => item.id === id)!;
    expect(after.parameters.hostWallId).toBe(wall.id);
    expect(after.parameters.centerHeightMm).toBe(1900);
    expect(Math.abs(Number(after.parameters.alongMm) - Number(before.parameters.alongMm))).toBe(400);
    expect(after.position.z).toBe(before.position.z);
  });

  it("moves a ceiling light in plan and leaves its height to the room", () => {
    const { project, id } = withLight("panel");
    const moved = relocateLight(project, id, { x: 900, y: 50, z: -700 });
    const compiled = compileLivingRoomScene(moved).lights.find((item) => item.id === id)!;
    const room = moved.rooms.find((item) => item.id === moved.activeRoomId)!;
    expect(compiled.position.x).toBe(900);
    expect(compiled.position.z).toBe(-700);
    expect(compiled.position.y).toBeGreaterThan(room.dimensions.heightMm - 200);
  });

  it("ignores an unknown light", () => {
    const { project } = withLight("rope");
    expect(relocateLight(project, "missing", { x: 0, y: 0, z: 0 })).toBe(project);
  });
});
