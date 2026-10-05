import { describe, expect, it } from "vitest";
import type { CabinetConfig } from "../cabinetDimensions";
import { readPlanningExtension } from "../cabinetIdentity";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { DOOR_SOURCING_PARAMETER, FRONT_SYSTEM_PARAMETER, applyFrontSystemParameters } from "../frontSystem";
import { readApplianceHost } from "../hostedAppliances/parameters";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { roomPlanViewBounds } from "../interiorProject";
import { MODEL_VIEW_FIXTURE_SOURCE_BUDGET, shaderSourceTotal, sumShaderCounts } from "../livingRoom/fixtureLightBudget";
import { LIVING_ROOM_MATERIAL_IDS } from "../livingRoom/materials";
import { isWallPanelObject } from "../livingRoom/panelAttachment";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { APARTMENT_TEMPLATE_IDS, composeApartment, lookupApartmentTemplate } from "./index";
import { roomIdByKey } from "./testSupport";

const built = APARTMENT_TEMPLATE_IDS.map((id) => {
  const spec = lookupApartmentTemplate(id)!;
  return { id, spec, project: composeApartment(spec, { now: COMPOSER_TEST_NOW }) };
});
const byId = (id: string) => built.find((item) => item.id === id)!;
const all = (pick: (project: InteriorProject) => InteriorObjectEntity[]) => built.flatMap(({ project }) => pick(project));
const cabinets = (project: InteriorProject) => project.objects.filter((o) => o.kind === "cabinet" && o.category !== "filler");

function frontConfig(object: InteriorObjectEntity): CabinetConfig | null {
  const config = readPlanningExtension(object.extensions)?.config as CabinetConfig | undefined;
  return config ? applyFrontSystemParameters(config, object.parameters) : null;
}

describe("showcase coverage details (built project)", () => {
  it("gola L, C and wall profiles are really resolved on built cabinets", () => {
    const kinds = new Set(all(cabinets).flatMap((object) => {
      const config = frontConfig(object);
      return config ? resolveFrontGaps(config).profiles.map((band) => band.kind) : [];
    }));
    for (const kind of ["L", "C", "wall"]) expect(kinds.has(kind as never), kind).toBe(true);
  });

  it("doors ship both bought and in-house", () => {
    const sourcing = new Set(all((p) => p.objects).map((o) => o.parameters[DOOR_SOURCING_PARAMETER]));
    expect(sourcing.has("bought")).toBe(true);
    expect(sourcing.has("in-house")).toBe(true);
  });

  it("every sink and hob is hosted in a cabinet of the same room", () => {
    for (const { id, project } of built) {
      const appliances = project.objects.filter((o) =>
        o.catalogItemId === "kitchen-sink-1" || o.catalogItemId === "kitchen-stove-electric-1");
      expect(appliances.length, id).toBeGreaterThanOrEqual(2);
      for (const appliance of appliances) {
        const host = project.objects.find((o) => o.id === readApplianceHost(appliance)?.hostCabinetId);
        expect(host?.kind, `${id} ${appliance.id}`).toBe("cabinet");
        expect(host?.roomId, `${id} ${appliance.id}`).toBe(appliance.roomId);
      }
    }
  });

  it("2 BHK pushes in the kitchen and the master wardrobe", () => {
    const { project } = byId("template:apartment:2bhk:v1");
    const ids = roomIdByKey(project);
    const kitchen = cabinets(project).filter((o) => o.roomId === ids.get("kitchen"));
    expect(kitchen.length).toBeGreaterThan(0);
    expect(kitchen.every((o) => o.parameters[FRONT_SYSTEM_PARAMETER] === "push")).toBe(true);
    const wardrobe = project.objects.find((o) => o.roomId === ids.get("master") && o.id.endsWith("-wardrobe"));
    expect(wardrobe?.parameters[FRONT_SYSTEM_PARAMETER]).toBe("push");
  });

  it("fluted / slat comes from an authored preset, not the default TV feature panel", () => {
    const authored = all((p) => p.objects).filter((o) =>
      o.catalogItemId === "living:feature-wall-fluted" && /-(feature-decor|headboard)$/.test(o.id));
    expect(authored.length).toBeGreaterThan(0);
  });

  it("finish roles reach joinery and decor in every room, with real finishes (no wall paint)", () => {
    for (const { id, spec, project } of built) {
      const roles = spec.finishRoles;
      for (const role of ["carcass", "front-primary", "front-accent", "worktop", "wall-panel"] as const) {
        expect(roles[role], `${id} ${role}`).not.toBe(LIVING_ROOM_MATERIAL_IDS.wallPaint);
      }
      for (const object of project.objects) {
        const slots = object.materialSlots ?? {};
        if (object.kind === "cabinet" && object.category !== "filler" && !isWallPanelObject(object)) {
          expect(slots.carcass, `${id} ${object.id}`).toBe(roles.carcass);
        }
        if (object.catalogItemId === "living:wardrobe-wall" || object.catalogItemId === "living:corner-wardrobe") {
          expect(slots.fronts, `${id} ${object.id}`).toBe(roles["front-primary"]);
        }
        if (isWallPanelObject(object) && !("mirror" in slots)) {
          const face = slots.face ?? slots.field ?? slots.slats ?? slots.surface;
          if (face) expect(face, `${id} ${object.id}`).toBe(roles["wall-panel"]);
        }
      }
    }
  });

  it("room light budget counts shader sources, not fixtures", () => {
    for (const { id, project } of built) {
      for (const room of project.rooms) {
        const sources = shaderSourceTotal(sumShaderCounts(project.lights.filter((l) => l.roomId === room.id)));
        expect(sources, `${id} ${room.extensions?.apartmentRoomKey}`).toBeLessThanOrEqual(MODEL_VIEW_FIXTURE_SOURCE_BUDGET);
      }
    }
  });

  it("the corner wardrobe sits in a corner of its room", () => {
    const corners = all((p) => p.objects).filter((o) => o.catalogItemId === "living:corner-wardrobe");
    expect(corners.length).toBeGreaterThan(0);
    for (const { project } of built) {
      for (const object of project.objects.filter((o) => o.catalogItemId === "living:corner-wardrobe")) {
        const b = roomPlanViewBounds(project, object.roomId);
        const half = object.dimensions.widthMm / 2;
        const dx = Math.min(Math.abs(object.position.x - half - b.minX), Math.abs(b.maxX - object.position.x - half));
        const dz = Math.min(Math.abs(object.position.z - half - b.minZ), Math.abs(b.maxZ - object.position.z - half));
        // Hosted on one wall (≈ depth/2 off it) and its side within a wall thickness of the return wall.
        expect(Math.min(dx, dz), object.id).toBeLessThanOrEqual(150);
      }
    }
  });
});
