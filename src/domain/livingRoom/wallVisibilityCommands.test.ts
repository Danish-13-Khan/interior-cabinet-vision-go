import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import {
  listHiddenWalls,
  setWallVisible,
  showAllWalls,
  wallVisibilityLabelInProject,
} from "./wallVisibilityCommands";

describe("wall visibility commands (M2)", () => {
  it("hides one wall and persists through save/reopen", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wallId = project.walls[0]?.id;
    expect(wallId).toBeTruthy();

    const hidden = setWallVisible(project, wallId!, false);
    expect(hidden.walls.find((wall) => wall.id === wallId)?.visible).toBe(false);
    expect(listHiddenWalls(hidden)).toHaveLength(1);

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(hidden)).document;
    expect(reopened.walls.find((wall) => wall.id === wallId)?.visible).toBe(false);
    expect(listHiddenWalls(reopened).map((wall) => wall.id)).toEqual([wallId]);
  });

  it("showAllWalls restores every wall without inventing object hide", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const first = project.walls[0]!.id;
    const second = project.walls[1]!.id;
    const withHidden = setWallVisible(setWallVisible(project, first, false), second, false);
    expect(listHiddenWalls(withHidden)).toHaveLength(2);

    const shown = showAllWalls(withHidden);
    expect(shown.walls.every((wall) => wall.visible)).toBe(true);
    expect(listHiddenWalls(shown)).toHaveLength(0);
    expect(shown.objects).toEqual(withHidden.objects);
  });

  it("labels unnamed hidden walls by project order, not hidden-list order", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    expect(project.walls.length).toBeGreaterThanOrEqual(4);
    const fourth = { ...project.walls[3]!, extensions: {} };
    const withUnnamed = {
      ...project,
      walls: project.walls.map((wall, index) => (index === 3 ? fourth : { ...wall, extensions: {} })),
    };
    const onlyFourthHidden = setWallVisible(withUnnamed, fourth.id, false);
    expect(listHiddenWalls(onlyFourthHidden)).toHaveLength(1);
    expect(wallVisibilityLabelInProject(onlyFourthHidden, fourth)).toBe("Wall 4");
  });
});
