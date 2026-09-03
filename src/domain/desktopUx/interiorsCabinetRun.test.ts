import { describe, expect, it } from "vitest";
import type { InteriorProject } from "../interiorProject";
import { cabinetRunLengthMm, LIVING_ROOM_CATALOG } from "../livingRoom";
import {
  interiorsCabinetRunCountLabel,
  interiorsCabinetRunCounts,
  interiorsCabinetRunFamilyItems,
  interiorsCabinetRunHint,
  interiorsCabinetRunSnapTarget,
  interiorsCabinetRunWarnings,
  isInteriorsCabinetRunTool,
} from "./interiorsCabinetRun";

describe("interiorsCabinetRun", () => {
  it("keeps design tools on the cabinet run screen", () => {
    expect(isInteriorsCabinetRunTool("cabinet")).toBe(true);
    expect(isInteriorsCabinetRunTool("run")).toBe(true);
    expect(isInteriorsCabinetRunTool("shelf")).toBe(true);
    expect(isInteriorsCabinetRunTool("material")).toBe(true);
    expect(isInteriorsCabinetRunTool("select")).toBe(false);
    expect(interiorsCabinetRunHint("cabinet")).toContain("cabinet family");
    expect(interiorsCabinetRunHint("run")).toContain("snap");
  });

  it("lists golden families and open shelf without furniture", () => {
    const cabinets = interiorsCabinetRunFamilyItems("cabinet", LIVING_ROOM_CATALOG);
    expect(cabinets.map((item) => item.cabinetType)).toEqual([
      "base", "drawer", "wall", "tall", "open-shelf",
    ]);
    expect(interiorsCabinetRunFamilyItems("shelf", LIVING_ROOM_CATALOG).every((item) => item.cabinetType === "open-shelf")).toBe(true);
    expect(interiorsCabinetRunFamilyItems("material", LIVING_ROOM_CATALOG)).toEqual([]);
  });

  it("counts room cabinets and prefers warnings beside the selection", () => {
    const project = {
      activeRoomId: "room-a",
      objects: [
        { id: "a", kind: "cabinet", roomId: "room-a" },
        { id: "b", kind: "cabinet", roomId: "room-a", category: "filler" },
        { id: "c", kind: "cabinet", roomId: "room-b" },
      ],
    } as InteriorProject;
    expect(interiorsCabinetRunCounts(project)).toEqual({
      cabinetCount: 2, fillerCount: 0, runCount: 0,
    });
    expect(interiorsCabinetRunCountLabel({ cabinetCount: 2, fillerCount: 1, runCount: 1 }))
      .toBe("2 cabinets · 1 filler · 1 run");
    const issues = [
      { code: "overlap", severity: "warning", objectIds: ["a"], message: "A overlaps" },
      { code: "overlap", severity: "warning", objectIds: ["b"], message: "B overlaps" },
    ] as const;
    expect(interiorsCabinetRunWarnings(issues, ["a"]).map((issue) => issue.message)).toEqual(["A overlaps"]);
  });

  it("snaps to the shared wall attachment, not the first room wall", () => {
    expect(interiorsCabinetRunSnapTarget([
      { id: "a", extensions: { wallAttachment: { wallId: "wall-3" } } },
      { id: "b", extensions: { wallAttachment: { wallId: "wall-3" } } },
    ])).toEqual({ wallId: "wall-3", warning: null });
  });

  it("rejects mixed-wall and unattached selections with an actionable warning", () => {
    expect(interiorsCabinetRunSnapTarget([
      { id: "a", extensions: { wallAttachment: { wallId: "wall-1" } } },
      { id: "b", extensions: { wallAttachment: { wallId: "wall-2" } } },
    ])).toEqual({
      wallId: null,
      warning: "Select cabinets on one wall. Mixed-wall selections cannot snap into a run.",
    });
    expect(interiorsCabinetRunSnapTarget([
      { id: "a", extensions: { wallAttachment: { wallId: "wall-3" } } },
      { id: "b" },
    ]).warning).toBe("Snap each cabinet to a wall before creating a run");
  });

  it("derives occupied millwork length from member widths and gap", () => {
    const project = {
      objects: [
        { dimensions: { widthMm: 800 }, extensions: { cabinetRun: { runId: "run-1", wallId: "w", gapMm: 0 } } },
        { dimensions: { widthMm: 900 }, extensions: { cabinetRun: { runId: "run-1", wallId: "w", gapMm: 0 } } },
        { dimensions: { widthMm: 80 }, extensions: { cabinetRunFiller: { runId: "run-1" } } },
      ],
    } as InteriorProject;
    expect(cabinetRunLengthMm(project, "run-1")).toBe(1700);
  });
});
