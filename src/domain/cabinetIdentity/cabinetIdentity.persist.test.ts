import { describe, expect, it } from "vitest";
import { createOffsetDuplicate } from "../cabinetDuplication";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  addLivingRoomObject,
  createLivingRoomObject,
  createLivingRoomStarterProject,
} from "../livingRoom";
import { DEFAULT_ROOM } from "../roomModel";

const NOW = "2026-08-30T08:20:00.000Z";

function withGoldenBase() {
  const starter = createLivingRoomStarterProject({ now: NOW });
  const roomId = starter.activeRoomId;
  return addLivingRoomObject(
    starter,
    createLivingRoomObject("living:base-cabinet-900", {
      id: "golden-base",
      roomId,
      position: { x: 0, y: 0, z: 0 },
    }),
  );
}

describe("cabinet identity persistence", () => {
  it("deletes a golden cabinet while preserving a feature wall", () => {
    const loaded = cabinetProjectFromInteriorProject(withGoldenBase());
    expect(loaded.project.cabinets.some((item) => item.config.catalogItemId === "living:base-cabinet-900")).toBe(true);
    const resaved = interiorProjectFromCabinetProject({
      project: { ...loaded.project, cabinets: [] },
      activeRoom: loaded.room,
      now: NOW,
    });
    expect(resaved.objects.some((object) => object.catalogItemId === "living:base-cabinet-900")).toBe(false);
    expect(resaved.objects.some((object) => object.catalogItemId === "living:feature-wall-fluted")).toBe(true);
    expect(resaved.objects.some((object) => object.catalogItemId === "living:display-niche")).toBe(true);
  });

  it("saves editor edits, duplicates, and deletes after load", () => {
    const starter = withGoldenBase();
    const roomId = starter.activeRoomId;
    const withWall = addLivingRoomObject(
      starter,
      createLivingRoomObject("living:wall-cabinet-900", {
        id: "golden-wall",
        roomId,
        position: { x: 1000, y: 1400, z: 0 },
      }),
    );
    const loaded = cabinetProjectFromInteriorProject(withWall);
    const base = loaded.project.cabinets.find((item) => item.config.catalogItemId === "living:base-cabinet-900")!;
    const wall = loaded.project.cabinets.find((item) => item.config.catalogItemId === "living:wall-cabinet-900")!;
    const renamed = {
      ...base,
      name: "Renamed Base",
      config: {
        ...base.config,
        dimensions: { ...base.config.dimensions, width: 800 },
      },
    };
    const duplicate = createOffsetDuplicate(
      renamed,
      0,
      { version: 1, cabinets: [renamed, wall] },
      loaded.room,
      { widthMm: 6200, depthMm: 4600, heightMm: 2800 },
    );
    const edited = {
      ...loaded.project,
      cabinets: [renamed, duplicate],
    };
    const saved = serializeInteriorProjectFile(
      interiorProjectFromCabinetProject({
        project: edited,
        activeRoom: loaded.room,
        now: NOW,
      }),
      NOW,
    );
    const reloaded = loadInteriorProjectFile(saved, DEFAULT_ROOM);
    const names = reloaded.project.cabinets.map((item) => item.name).sort();
    expect(names).toContain("Renamed Base");
    expect(names).toContain("Renamed Base Copy");
    expect(reloaded.project.cabinets).toHaveLength(2);
    expect(reloaded.project.cabinets.some((item) => item.id === wall.id)).toBe(false);
    expect(reloaded.project.cabinets.find((item) => item.name === "Renamed Base")?.config.dimensions.width).toBe(800);
    expect(reloaded.document.objects.some((object) => object.catalogItemId === "living:feature-wall-fluted")).toBe(true);
  });
});
