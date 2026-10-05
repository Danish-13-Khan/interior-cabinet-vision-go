import { describe, expect, it } from "vitest";
import { createProjectReport } from "../projectReport";
import { cabinetProjectFromInteriorProject, validateInteriorProject } from "../interiorProject";
import { FRONT_SYSTEM_PARAMETER, DOOR_STYLE_PARAMETER, DOOR_SOURCING_PARAMETER } from "../frontSystem";
import { listCurrentProjectCabinets, readPlanningExtension } from "../cabinetIdentity";
import type { CabinetConfig } from "../cabinetDimensions";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import {
  ONE_BHK_SHELL_SPEC,
  STUDIO_SHELL_SPEC,
  composeApartment,
  instantiateApartmentTemplate,
  roomObjectsOverlapOpenings,
} from "./index";
import { roomIdByKey } from "./testSupport";

const options = { now: COMPOSER_TEST_NOW };
const PHASE4 = [
  { id: "template:apartment:studio:v1" as const, spec: STUDIO_SHELL_SPEC },
  { id: "template:apartment:1bhk:v1" as const, spec: ONE_BHK_SHELL_SPEC },
];

describe("Phase 4 Studio and 1 BHK authored templates", () => {
  it("opens from the dev entry in the hero room with no validation repairs", () => {
    for (const { id, spec } of PHASE4) {
      const started = performance.now();
      const project = instantiateApartmentTemplate(id, options);
      expect(performance.now() - started, id).toBeLessThan(2000);
      const heroId = roomIdByKey(project).get(spec.heroRoomKey);
      expect(project.activeRoomId, id).toBe(heroId);
      expect(project.extensions?.apartmentTemplateId, id).toBe(id);
      const result = validateInteriorProject(project);
      expect(result.issues.filter((i) => i.repaired), id).toEqual([]);
      expect(result.issues.filter((i) => i.severity === "error"), id).toEqual([]);
    }
  });

  it("authors composition, finishes, lights, and one showcase camera per room", () => {
    for (const { spec } of PHASE4) {
      const project = composeApartment(spec, options);
      const ids = roomIdByKey(project);
      expect(spec.rooms.every((room) => room.compose.kind !== "none"), spec.id).toBe(true);
      expect(spec.rooms.every((room) => room.camera), spec.id).toBe(true);
      for (const room of spec.rooms) {
        const roomId = ids.get(room.key)!;
        expect(project.objects.some((o) => o.roomId === roomId), `${spec.id} ${room.key}`).toBe(true);
        const overlaps = roomObjectsOverlapOpenings(project, roomId)
          .filter((object) => object.kind === "cabinet");
        expect(overlaps, `${spec.id} ${room.key}`).toEqual([]);
        const cam = project.cameras.find((c) => c.roomId === roomId && c.name.includes("Showcase"));
        expect(cam, `${spec.id} ${room.key} camera`).toBeTruthy();
        expect(
          project.renderSettings.packageCameraBookmarks?.some((b) => b.cameraId === cam!.id),
          `${spec.id} ${room.key} bookmark`,
        ).toBe(true);
      }
      const heroCam = project.cameras.find((c) => c.isDefault);
      expect(heroCam?.roomId).toBe(ids.get(spec.heroRoomKey));
      expect(project.renderSettings.activeCameraId).toBe(heroCam?.id);
    }
  });

  it("Studio shows gola + slab in-house; 1 BHK shows bar/knob + shaker bought", () => {
    const studio = composeApartment(STUDIO_SHELL_SPEC, options);
    const studioIds = roomIdByKey(studio);
    const studioKitchenId = studioIds.get("entry")!;
    const kitchen = studio.objects.find(
      (o) => o.roomId === studioKitchenId && o.kind === "cabinet" && o.category !== "filler",
    )!;
    expect(kitchen.parameters[FRONT_SYSTEM_PARAMETER]).toBe("gola");
    expect(kitchen.parameters[DOOR_STYLE_PARAMETER]).toBe("slab");
    expect(kitchen.parameters[DOOR_SOURCING_PARAMETER]).toBe("in-house");
    expect(kitchen.materialSlots.fronts).toBe(STUDIO_SHELL_SPEC.finishRoles["front-primary"]);
    expect(studio.lights.some((l) => l.parameters.fixtureKind === "cove")).toBe(true);
    expect(studio.lights.some((l) => l.parameters.fixtureKind === "under-cabinet")).toBe(true);
    expect(studio.lights.some((l) => l.parameters.fixtureKind === "rope")).toBe(true);
    expect(studio.objects.some((o) => o.id.includes("wardrobe"))).toBe(true);

    const one = composeApartment(ONE_BHK_SHELL_SPEC, options);
    const oneIds = roomIdByKey(one);
    const oneKitchenId = oneIds.get("kitchen")!;
    const oneKitchen = one.objects.find(
      (o) => o.roomId === oneKitchenId && o.kind === "cabinet" && o.category !== "filler"
        && !o.id.includes("-leg-"),
    )!;
    expect(oneKitchen.parameters[FRONT_SYSTEM_PARAMETER]).toBe("handled");
    expect(oneKitchen.parameters[DOOR_STYLE_PARAMETER]).toBe("shaker");
    expect(oneKitchen.parameters[DOOR_SOURCING_PARAMETER]).toBe("bought");
    const kitchenHw = (readPlanningExtension(oneKitchen.extensions)?.config as CabinetConfig | undefined)
      ?.hardware?.handleId;
    expect(kitchenHw).toBe("handle-bar");
    const bedroomId = oneIds.get("bedroom")!;
    const wardrobe = one.objects.find((o) => o.roomId === bedroomId && o.id.includes("wardrobe"))!;
    const wardrobeHw = (readPlanningExtension(wardrobe.extensions)?.config as CabinetConfig | undefined)
      ?.hardware?.handleId;
    expect(wardrobeHw).toBe("handle-knob");
    expect(one.lights.some((l) => l.parameters.fixtureKind === "track")).toBe(true);
    expect(one.lights.some((l) => l.parameters.fixtureKind === "panel")).toBe(true);
    expect(one.lights.some((l) => l.parameters.fixtureKind === "pendant")).toBe(true);
    expect(one.objects.some((o) => o.catalogItemId === "kitchen-sink-1")).toBe(true);
  });

  it("production export succeeds (cut list + hardware schedule)", () => {
    for (const { id } of PHASE4) {
      const project = instantiateApartmentTemplate(id, options);
      const adapted = cabinetProjectFromInteriorProject(project);
      expect(adapted.diagnostics.filter((d) => d.blocking), id).toEqual([]);
      const allCabinets = listCurrentProjectCabinets(adapted.project);
      expect(allCabinets.length, id).toBeGreaterThan(0);
      // Whole-apartment export: active hero room may be furniture-only (living).
      const exportProject = { ...adapted.project, cabinets: allCabinets };
      const exportRoom = adapted.project.rooms?.find((room) => room.cabinets.length)?.config
        ?? adapted.room;
      const report = createProjectReport(exportProject, exportRoom);
      expect(report.productionBlocked, id).toBe(false);
      expect(report.productionCutlist.length, id).toBeGreaterThan(0);
      expect(report.hardwareSchedule.length, id).toBeGreaterThan(0);
    }
  });

  it("composed Studio and 1 BHK are deterministic (D3)", () => {
    for (const { spec } of PHASE4) {
      const a = composeApartment(spec, options);
      const b = composeApartment(spec, options);
      expect(JSON.stringify(a), spec.id).toBe(JSON.stringify(b));
    }
  });
});
