import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "./createProject";
import { GOLDEN_RUN_FILLER_IDS, GOLDEN_RUN_OBJECT_IDS } from "./types";

describe("golden run end fillers", () => {
  const project = createGoldenCabinetRunProject();
  const byId = (id: string) => project.objects.find((object) => object.id === id)!;
  const front = (id: string) => byId(id).position.z + byId(id).dimensions.depthMm / 2;
  const back = (id: string) => byId(id).position.z - byId(id).dimensions.depthMm / 2;
  const backWall = project.walls.find((wall) => wall.id.includes("back")) ?? project.walls[0]!;
  const innerFace = Math.min(backWall.start.z, backWall.end.z) + backWall.thicknessMm / 2;

  it("sit flush with the cabinet fronts they close off", () => {
    expect(front(GOLDEN_RUN_FILLER_IDS.start)).toBe(front(GOLDEN_RUN_OBJECT_IDS.tall));
    expect(front(GOLDEN_RUN_FILLER_IDS.end)).toBe(front(GOLDEN_RUN_OBJECT_IDS.baseB));
  });

  it("stay clear of the back wall", () => {
    expect(innerFace).toBe(-1940);
    for (const id of Object.values(GOLDEN_RUN_FILLER_IDS)) expect(back(id)).toBeGreaterThanOrEqual(innerFace);
  });
});
