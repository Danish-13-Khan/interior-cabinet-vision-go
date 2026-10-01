import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import { DEFAULT_FLOOR_BUILD, resolveFloorBuild, writeFloorBuild } from "../interiorProject/floorBuild";
import { compileLivingRoomScene } from "./sceneCompiler";
import { createLivingRoomStarterProject } from "./preset";
import { addRoomLightFixture, isRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";
import { addWallDecoration } from "./wallDecorations";
import { readPanelAttachment } from "./panelAttachment";
import { updatePanelAttachment } from "./panelCommands";

const NOW = "2026-10-01T00:00:00.000Z";

function starter() {
  return createLivingRoomStarterProject({ now: NOW });
}

function reopen(project: ReturnType<typeof starter>) {
  return loadInteriorProjectFile(serializeInteriorProjectFile(project, NOW)).document;
}

function light(project: ReturnType<typeof starter>, id: string) {
  return project.lights.find((item) => item.id === id)!;
}

describe("phase 8 validation", () => {
  it("round-trips every new floor, fixture, and decoration property", () => {
    const source = starter();
    const room = source.rooms.find((item) => item.id === source.activeRoomId)!;
    const wall = source.walls.find((item) => item.extensions?.wallSide === "back")!;
    const cabinet = source.objects.find((item) => item.kind === "cabinet")!;
    let project = {
      ...source,
      rooms: source.rooms.map((item) => item.id === room.id
        ? writeFloorBuild(item, { structuralThicknessMm: 180, flooringThicknessMm: 14 })
        : item),
    };
    project = addRoomLightFixture(project, "cove", { kind: "wall", wallId: wall.id });
    const coveId = project.lights.at(-1)!.id;
    project = updateRoomLightFixture(project, coveId, { intensity: 42, parameters: { widthMm: 1800, colorTemperatureK: 3200, fitHostWidth: false } });
    project = addRoomLightFixture(project, "profile", { kind: "wall", wallId: wall.id });
    const profileId = project.lights.at(-1)!.id;
    project = updateRoomLightFixture(project, profileId, { parameters: { orientation: "vertical", profileFinish: "black" } });
    project = addRoomLightFixture(project, "track", { kind: "ceiling" });
    const trackId = project.lights.at(-1)!.id;
    project = updateRoomLightFixture(project, trackId, {
      parameters: { headCount: 4, aimAngleDeg: 15, beamAngleDeg: 24, profileFinish: "white", ceilingDropMm: 90 },
    });
    project = addRoomLightFixture(project, "under-cabinet", { kind: "object", hostObjectId: cabinet.id });
    const stripId = project.lights.at(-1)!.id;
    project = updateRoomLightFixture(project, stripId, {
      parameters: { offsetXmm: 40, offsetYmm: -20, offsetZmm: 15, fitHostWidth: false },
    });
    project = addWallDecoration(project, wall.id, "wainscot");
    const panelId = project.objects.at(-1)!.id;
    project = updatePanelAttachment(project, panelId, { wallSide: "exterior", floorOffsetMm: 40, visible: false });

    const back = reopen(project);
    const restored = back.rooms.find((item) => item.id === room.id)!;
    expect(restored.extensions?.floorBuild).toEqual({ structuralThicknessMm: 180, flooringThicknessMm: 14 });
    const cove = light(back, coveId);
    expect(cove).toMatchObject({ enabled: true, intensity: 42 });
    expect(cove.parameters).toMatchObject({
      fixtureKind: "cove", hostWallId: wall.id, wallSide: "interior", fitHostWidth: false,
      widthMm: 1800, colorTemperatureK: 3200, centerHeightMm: cove.parameters.centerHeightMm, alongMm: cove.parameters.alongMm,
    });
    expect(typeof cove.parameters.centerHeightMm).toBe("number");
    expect(typeof cove.parameters.alongMm).toBe("number");
    expect(cove.parameters.heightMm).toBe(light(project, coveId).parameters.heightMm);
    expect(cove.parameters.depthMm).toBe(light(project, coveId).parameters.depthMm);
    expect(cove.parameters.rangeMm).toBe(light(project, coveId).parameters.rangeMm);
    expect(light(back, profileId).parameters).toMatchObject({
      fixtureKind: "profile", orientation: "vertical", profileFinish: "black", hostWallId: wall.id,
    });
    expect(light(back, trackId).parameters).toMatchObject({
      fixtureKind: "track", hostSurface: "ceiling", ceilingDropMm: 90,
      headCount: 4, aimAngleDeg: 15, beamAngleDeg: 24, profileFinish: "white",
    });
    expect(light(back, stripId).parameters).toMatchObject({
      fixtureKind: "under-cabinet", hostObjectId: cabinet.id,
      offsetXmm: 40, offsetYmm: -20, offsetZmm: 15, fitHostWidth: false,
    });
    const panel = back.objects.find((item) => item.id === panelId)!;
    expect(panel.catalogItemId).toBe("living:wainscot-panel");
    expect(readPanelAttachment(panel)).toMatchObject({
      wallId: wall.id, wallSide: "exterior", floorOffsetMm: 40, visible: false,
    });
    expect(typeof readPanelAttachment(panel)?.alongMm).toBe("number");
  });

  it("loads an unknown fixtureKind, a room without floorBuild, and a legacy wallId panel", () => {
    const source = starter();
    const wall = source.walls[0]!;
    const withPanel = addWallPanelLegacy(source, wall.id);
    const file = JSON.parse(serializeInteriorProjectFile(withPanel, NOW)) as {
      project: {
        lights: { id: string; parameters: Record<string, unknown> }[];
        rooms: { extensions?: Record<string, unknown> }[];
        objects: { id: string; extensions?: { wallAttachment?: Record<string, unknown> } }[];
      };
    };
    const rogue = file.project.lights[0]!;
    rogue.parameters = { ...rogue.parameters, fixtureKind: "lantern" };
    delete file.project.rooms[0]!.extensions?.floorBuild;
    const panel = file.project.objects.find((item) => item.extensions?.wallAttachment)!;
    panel.extensions!.wallAttachment = { wallId: wall.id };

    const loaded = loadInteriorProjectFile(file).document;
    const unknown = loaded.lights.find((item) => item.id === rogue.id)!;
    expect(unknown.parameters.fixtureKind).toBe("lantern");
    expect(isRoomLightFixture(unknown)).toBe(false);
    expect(() => compileLivingRoomScene(loaded)).not.toThrow();
    expect(compileLivingRoomScene(loaded).lights.some((item) => item.id === rogue.id)).toBe(true);
    expect(resolveFloorBuild(loaded.rooms[0]!)).toEqual(DEFAULT_FLOOR_BUILD);
    const legacy = loaded.objects.find((item) => item.id === panel.id)!;
    expect(readPanelAttachment(legacy)).toMatchObject({ wallId: wall.id, alongMm: 0, floorOffsetMm: 0, visible: true });
  });
});

function addWallPanelLegacy(project: ReturnType<typeof starter>, wallId: string) {
  return addWallDecoration(project, wallId, "custom");
}
