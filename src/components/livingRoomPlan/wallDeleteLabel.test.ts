import { describe, expect, it } from "vitest";
import type { WallEntity } from "../../domain/interiorProject";
import { wallDeleteActionLabel } from "./wallDeleteLabel";

describe("wall delete label", () => {
  it("says Delete wall, because a split does not record a section", () => {
    const wall = { id: "wall-2", extensions: { createdBy: "draw-room" } } as WallEntity;
    expect(wallDeleteActionLabel(wall)).toBe("Delete wall");
    expect(wallDeleteActionLabel({ ...wall, extensions: undefined })).toBe("Delete wall");
  });
});
