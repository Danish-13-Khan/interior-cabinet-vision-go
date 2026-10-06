import { describe, expect, it } from "vitest";
import { MODEL_VIEW_FIXTURE_SOURCE_BUDGET } from "../livingRoom/fixtureLightBudget";
import { isLightFixtureKind } from "../livingRoom/lightFixtureRegistry";
import { FRONT_SYSTEM_PARAMETER, DOOR_STYLE_PARAMETER, slidingDoorsOf } from "../frontSystem";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { readPlanningExtension } from "../cabinetIdentity";
import type { CabinetConfig } from "../cabinetDimensions";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import {
  APARTMENT_TEMPLATE_IDS,
  composeApartment,
  lookupApartmentTemplate,
} from "./index";
import { builtKitchenLayout } from "./builtLayout";
import { roomIdByKey } from "./testSupport";

const options = { now: COMPOSER_TEST_NOW };

function built() {
  return APARTMENT_TEMPLATE_IDS.map((id) => {
    const spec = lookupApartmentTemplate(id)!;
    return { id, spec, project: composeApartment(spec, options) };
  });
}

function fixtureKinds(project: ReturnType<typeof composeApartment>, roomId?: string) {
  return new Set(
    project.lights
      .filter((light) => !roomId || light.roomId === roomId)
      .map((light) => String(light.parameters.fixtureKind ?? "")),
  );
}

function decorPresets(project: ReturnType<typeof composeApartment>) {
  const presets = new Set<string>();
  for (const object of project.objects) {
    const preset = object.parameters.wallDecorationPreset ?? object.extensions?.wallDecorationPreset;
    if (typeof preset === "string") presets.add(preset);
    // addWallDecoration stamps catalog ids — map known ones back to presets.
    const catalog = object.catalogItemId;
    // The default TV feature panel alone does not count as the authored slat preset.
    if (catalog === "living:feature-wall-fluted" && /-(feature-decor|headboard)$/.test(object.id)) presets.add("slat");
    if (catalog === "living:wall-panel-full") presets.add("full");
    if (catalog === "living:wall-panel-vertical") presets.add("vertical");
    if (catalog === "living:wall-panel-horizontal") presets.add("horizontal");
    if (catalog === "living:wainscot-panel") presets.add("wainscot");
    if (catalog === "living:moulding-strip") presets.add("moulding");
    if (catalog === "living:profile-strip") presets.add("profile");
    if (catalog === "living:decorative-panel") presets.add("custom");
    if (catalog === "living:wall-mirror") presets.add("mirror");
  }
  return presets;
}

function handleIds(project: ReturnType<typeof composeApartment>) {
  const ids = new Set<string>();
  for (const object of project.objects) {
    if (object.kind !== "cabinet") continue;
    const handleId = (readPlanningExtension(object.extensions)?.config as CabinetConfig | undefined)
      ?.hardware?.handleId;
    if (handleId && handleId !== "none") ids.add(handleId);
  }
  return ids;
}

function frontKinds(project: ReturnType<typeof composeApartment>) {
  const kinds = new Set<string>();
  for (const object of project.objects) {
    const kind = object.parameters[FRONT_SYSTEM_PARAMETER];
    if (typeof kind === "string") kinds.add(kind);
  }
  return kinds;
}

describe("Phase 5 showcase coverage (§4 matrix)", () => {
  it("every capability appears in at least one of the four templates (D5)", () => {
    const all = built();
    const byId = Object.fromEntries(all.map((item) => [item.id, item]));

    expect(byId["template:apartment:studio:v1"]!.spec.styleId).toBe("nordic-light");
    expect(byId["template:apartment:1bhk:v1"]!.spec.styleId).toBe("warm-contemporary");
    expect(byId["template:apartment:2bhk:v1"]!.spec.styleId).toBe("moody-walnut");
    expect(byId["template:apartment:3bhk:v1"]!.spec.lightingRecipeId).toBe("warm-evening");

    // Read the layout back from the built cabinets, not the spec.
    const kitchenLayouts = all.flatMap(({ spec, project }) => {
      const ids = roomIdByKey(project);
      return spec.rooms.filter((room) => room.compose.kind === "kitchen")
        .map((room) => builtKitchenLayout(project, ids.get(room.key)!));
    });
    expect(kitchenLayouts).toEqual(expect.arrayContaining(["straight", "L", "parallel"]));

    const fronts = new Set(all.flatMap(({ project }) => [...frontKinds(project)]));
    expect(fronts.has("gola")).toBe(true);
    expect(fronts.has("handled")).toBe(true);
    expect(fronts.has("push")).toBe(true);

    const handles = new Set(all.flatMap(({ project }) => [...handleIds(project)]));
    expect(handles.has("handle-bar")).toBe(true);
    expect(handles.has("handle-knob")).toBe(true);
    expect(handles.has("handle-cup")).toBe(true);

    expect(all.some(({ project }) =>
      project.objects.some((o) => o.parameters[DOOR_STYLE_PARAMETER] === "slab"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.parameters[DOOR_STYLE_PARAMETER] === "shaker"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.parameters[DOOR_STYLE_PARAMETER] === "glass"))).toBe(true);

    expect(all.every(({ project }) =>
      project.objects.some((o) => o.catalogItemId === "kitchen-sink-1")
      && project.objects.some((o) => o.catalogItemId === "kitchen-stove-electric-1"))).toBe(true);

    expect(all.some(({ project }) => project.objects.some((o) => o.id.includes("tall")))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.catalogItemId === "living:tv-unit"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.catalogItemId === "living:display-niche"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.parameters.apartmentRole === "study-desk"
        || o.catalogItemId === "living:console-table"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.parameters.apartmentRole === "shoe-cabinet"))).toBe(true);
    expect(all.some(({ project }) =>
      project.objects.some((o) => o.catalogItemId === "living:corner-wardrobe"))).toBe(true);
    // Phase 3: the sliding row reads the built cabinets (Studio + 3 BHK master), not a stand-in.
    const isSliding = (o: (typeof all)[number]["project"]["objects"][number]) => {
      const cabinet = cabinetFromObject(o);
      return Boolean(cabinet && slidingDoorsOf(cabinet.config));
    };
    const slidingIn = (id: string) => all.find((entry) => entry.id === id)!.project.objects.some(isSliding);
    expect(slidingIn("template:apartment:studio:v1")).toBe(true);
    expect(slidingIn("template:apartment:3bhk:v1")).toBe(true);
    // Hinged wardrobes stay in the set too (1 BHK, 2 BHK kids, 3 BHK guest).
    expect(all.some(({ project }) => project.objects.some((o) =>
      o.catalogItemId === "living:wardrobe-wall" && !isSliding(o)))).toBe(true);

    const decor = new Set(all.flatMap(({ project }) => [...decorPresets(project)]));
    for (const preset of [
      "slat", "vertical", "full", "horizontal", "wainscot", "moulding", "custom", "profile", "mirror",
    ]) {
      expect(decor.has(preset), preset).toBe(true);
    }

    const fixtures = new Set(all.flatMap(({ project }) => [...fixtureKinds(project)]));
    for (const kind of [
      "cove", "rope", "profile", "under-cabinet", "ceiling-downlight", "cob", "panel", "track", "pendant",
    ]) {
      expect(fixtures.has(kind), kind).toBe(true);
    }
  });

  it("light count per room stays inside the model-view fixture budget", () => {
    for (const { id, project } of built()) {
      for (const room of project.rooms) {
        const count = project.lights.filter((light) =>
          light.roomId === room.id && isLightFixtureKind(light.parameters.fixtureKind)).length;
        expect(count, `${id} ${room.extensions?.apartmentRoomKey}`).toBeLessThanOrEqual(
          MODEL_VIEW_FIXTURE_SOURCE_BUDGET,
        );
      }
    }
  });

  it("2 BHK and 3 BHK open in the hero room with content in every composed room", () => {
    for (const id of [
      "template:apartment:2bhk:v1",
      "template:apartment:3bhk:v1",
    ] as const) {
      const spec = lookupApartmentTemplate(id)!;
      const project = composeApartment(spec, options);
      const ids = roomIdByKey(project);
      expect(project.activeRoomId).toBe(ids.get(spec.heroRoomKey));
      for (const room of spec.rooms.filter((item) => item.compose.kind !== "none")) {
        const roomId = ids.get(room.key)!;
        expect(
          project.objects.some((object) => object.roomId === roomId),
          `${id} ${room.key}`,
        ).toBe(true);
      }
    }
  });
});
