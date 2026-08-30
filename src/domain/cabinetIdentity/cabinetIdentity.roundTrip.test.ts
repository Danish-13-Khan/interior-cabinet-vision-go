import { describe, expect, it } from "vitest";
import { DEFAULT_ROOM } from "../roomModel";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import { addLivingRoomObject, createLivingRoomObject, createLivingRoomStarterProject } from "../livingRoom";
import {
  GOLDEN_CABINET_FAMILY_IDS,
  createGoldenCabinetInstance,
  familyType,
  goldenCatalogItemId,
} from "./index";

const NOW = "2026-08-30T08:00:00.000Z";

function projectFromCabinet(familyId: (typeof GOLDEN_CABINET_FAMILY_IDS)[number]) {
  const cabinet = createGoldenCabinetInstance(familyId);
  return interiorProjectFromCabinetProject({
    project: { version: 1, cabinets: [cabinet] },
    activeRoom: DEFAULT_ROOM,
    now: NOW,
  });
}

describe("cabinet identity round-trip", () => {
  it("keeps type, family, and id through Interior ↔ Cabinet and save/reopen", () => {
    for (const familyId of GOLDEN_CABINET_FAMILY_IDS) {
      const document = projectFromCabinet(familyId);
      const restored = cabinetProjectFromInteriorProject(document);
      const cabinet = restored.project.cabinets[0]!;
      expect(restored.diagnostics).toEqual([]);
      expect(cabinet.id).toBe(`golden-${familyType(familyId)}`);
      expect(cabinet.config.type).toBe(familyType(familyId));
      expect(cabinet.config.familyId).toBe(familyId);
      const loaded = loadInteriorProjectFile(serializeInteriorProjectFile(document, NOW), DEFAULT_ROOM);
      expect(loaded.project.cabinets[0]!.config.familyId).toBe(familyId);
      expect(loaded.project.cabinets[0]!.config.type).toBe(familyType(familyId));
    }
  });

  it("round-trips living-room catalog cabinets without falling back to base", () => {
    const starter = createLivingRoomStarterProject({ now: NOW });
    const roomId = starter.activeRoomId;
    const catalogIds = GOLDEN_CABINET_FAMILY_IDS.map(goldenCatalogItemId);
    const withCabinets = catalogIds.reduce(
      (project, catalogId, index) => addLivingRoomObject(
        project,
        createLivingRoomObject(catalogId, {
          id: `live-${index}`,
          roomId,
          position: { x: index * 1000, y: 0, z: 0 },
        }),
      ),
      starter,
    );
    const first = cabinetProjectFromInteriorProject(withCabinets);
    expect(new Set(first.project.cabinets.map((item) => item.config.type))).toEqual(
      new Set(["base", "wall", "tall", "drawer"]),
    );
    const resaved = interiorProjectFromCabinetProject({
      project: first.project,
      activeRoom: first.room,
      now: NOW,
    });
    const second = cabinetProjectFromInteriorProject(resaved);
    expect(new Set(second.project.cabinets.map((item) => item.config.familyId))).toEqual(
      new Set(GOLDEN_CABINET_FAMILY_IDS),
    );
    expect(second.diagnostics.filter((item) => item.blocking)).toEqual([]);
  });

  it("does not convert a feature wall into a production cabinet", () => {
    const starter = createLivingRoomStarterProject({ now: NOW });
    const compatible = cabinetProjectFromInteriorProject(starter);
    expect(compatible.project.cabinets).toEqual([]);
    expect(
      compatible.diagnostics.some((item) => item.code === "silent-fallback-blocked"),
    ).toBe(false);
  });

  it("preserves skipped cabinet objects on Interior to Cabinet to Interior", () => {
    const starter = createLivingRoomStarterProject({ now: NOW });
    const featureBefore = starter.objects.some(
      (object) => object.catalogItemId === "living:feature-wall-fluted",
    );
    const compatible = cabinetProjectFromInteriorProject(starter);
    const resaved = interiorProjectFromCabinetProject({
      project: compatible.project,
      activeRoom: compatible.room,
      now: NOW,
    });
    const featureAfter = resaved.objects.some(
      (object) => object.catalogItemId === "living:feature-wall-fluted",
    );
    expect(featureBefore).toBe(true);
    expect(featureAfter).toBe(true);
    expect(resaved.objects.some((object) => object.catalogItemId === "living:display-niche")).toBe(true);
  });
});
