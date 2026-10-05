import { describe, expect, it } from "vitest";
import { validateInteriorProject, wallLengthMm } from "../interiorProject";
import { addLivingRoomOpening } from "./openingCommands";
import { createLivingRoomStarterProject } from "./preset";
import { compileLivingRoomArchitecture } from "./sceneCompilerRoom";
import { CUT_OPENING_WIDTH_MM, createCutOpening, cutOpeningOffsetMm } from "./cutOpening";

describe("cut opening (phase 7)", () => {
  it("centres a full-height void that splits the wall without a new error", () => {
    const base = createLivingRoomStarterProject({ now: "2026-10-01T00:00:00.000Z" });
    const wall = base.walls.find((item) => item.extensions?.wallSide === "back");
    expect(wall).toBeTruthy();
    const host = wall!;
    const beforeErrors = validateInteriorProject(base).issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => issue.code);
    const offsetMm = cutOpeningOffsetMm(wallLengthMm(host));
    const next = addLivingRoomOpening(base, createCutOpening({
      id: "cut-1",
      roomId: base.activeRoomId,
      wallId: host.id,
      offsetMm,
      wallHeightMm: host.heightMm,
    }));
    const opening = next.openings.find((item) => item.id === "cut-1");
    expect(opening?.kind).toBe("opening");
    expect(opening?.widthMm).toBe(CUT_OPENING_WIDTH_MM);
    expect(opening?.offsetMm).toBe(offsetMm);
    expect(opening?.sillHeightMm).toBe(0);
    expect(opening?.heightMm).toBe(host.heightMm);
    const segments = compileLivingRoomArchitecture(next).filter((node) => node.metadata.wallId === host.id);
    expect(segments.length).toBeGreaterThan(1);
    expect(compileLivingRoomArchitecture(next).some((node) => node.metadata.openingId === "cut-1")).toBe(false);
    const afterErrors = validateInteriorProject(next).issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => issue.code);
    expect(afterErrors).toEqual(beforeErrors);
  });
});
