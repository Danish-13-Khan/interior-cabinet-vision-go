import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  validateInteriorProject,
} from "../interiorProject";
import {
  createLivingRoomStarterProject,
  LIVING_ROOM_CAMERA_KEYS,
  LIVING_ROOM_CATALOG,
  LIVING_ROOM_LIGHTING_RECIPES,
  LIVING_ROOM_MATERIAL_IDS,
  LIVING_ROOM_PRESET_ID,
} from ".";

const NOW = "2026-08-11T18:30:00.000Z";

describe("Living Room Starter Contract", () => {
  it("provides every object promised by the MVP catalog", () => {
    expect(LIVING_ROOM_CATALOG.map((item) => item.category)).toEqual([
      "sofa",
      "chair",
      "table",
      "table",
      "media-unit",
      "rug",
      "mirror",
      "floor-lamp",
    ]);
    expect(new Set(LIVING_ROOM_CATALOG.map((item) => item.id)).size).toBe(8);
    expect(LIVING_ROOM_CATALOG.every((item) => item.dimensions.widthMm > 0)).toBe(true);
  });

  it("creates a complete, valid starter room with resolved references", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const validation = validateInteriorProject(project);
    const roomId = project.activeRoomId;
    const wallIds = new Set(project.walls.map((wall) => wall.id));
    const materialIds = new Set(project.materials.map((material) => material.id));

    expect(validation.issues).toEqual([]);
    expect(project.id).toBe(LIVING_ROOM_PRESET_ID);
    expect(project.rooms).toHaveLength(1);
    expect(project.rooms[0]!.roomType).toBe("living-room");
    expect(project.walls).toHaveLength(4);
    expect(project.openings.map((opening) => opening.kind).sort()).toEqual([
      "door",
      "window",
    ]);
    expect(project.objects).toHaveLength(8);
    expect(project.objects.every((object) => object.roomId === roomId)).toBe(true);
    expect(project.openings.every((opening) => wallIds.has(opening.wallId))).toBe(true);
    expect(
      project.objects.every((object) =>
        Object.values(object.materialSlots).every((id) => materialIds.has(id)),
      ),
    ).toBe(true);
    expect(project.walls.every((wall) => materialIds.has(wall.materialId!))).toBe(true);
    expect(project.rooms[0]!.extensions?.floorMaterialId).toBe(
      LIVING_ROOM_MATERIAL_IDS.naturalOak,
    );
  });

  it("includes three switchable lighting recipes and three camera presets", () => {
    const project = createLivingRoomStarterProject({
      now: NOW,
      lightingRecipeId: "warm-evening",
    });
    const recipeIds = new Set(
      project.lights.map((light) => String(light.parameters.recipeId)),
    );
    const enabledLights = project.lights.filter((light) => light.enabled);

    expect(recipeIds).toEqual(
      new Set(LIVING_ROOM_LIGHTING_RECIPES.map((recipe) => recipe.id)),
    );
    expect(enabledLights).toHaveLength(3);
    expect(
      enabledLights.every((light) => light.parameters.recipeId === "warm-evening"),
    ).toBe(true);
    expect(project.renderSettings.lightingRecipeId).toBe("warm-evening");
    expect(project.cameras).toHaveLength(LIVING_ROOM_CAMERA_KEYS.length);
    expect(project.cameras.filter((camera) => camera.isDefault)).toHaveLength(1);
    expect(project.renderSettings.activeCameraId).toBe(
      project.cameras.find((camera) => camera.isDefault)!.id,
    );
  });

  it("is deterministic for the same timestamp and identity strategy", () => {
    const idFactory = (scope: string, key: string) => `test-${scope}-${key}`;
    const first = createLivingRoomStarterProject({
      projectId: "project-101",
      now: NOW,
      idFactory,
    });
    const second = createLivingRoomStarterProject({
      projectId: "project-101",
      now: NOW,
      idFactory,
    });

    expect(second).toEqual(first);
    expect(new Set(first.objects.map((object) => object.id)).size).toBe(
      first.objects.length,
    );
  });

  it("round-trips through the universal JSON format without data loss", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const serialized = serializeInteriorProjectFile(project, NOW);
    const loaded = loadInteriorProjectFile(serialized);

    expect(loaded.document).toEqual(project);
    expect(loaded.document.objects.map((object) => object.catalogItemId)).toEqual(
      project.objects.map((object) => object.catalogItemId),
    );
    expect(loaded.project.interiorDocument).toEqual(project);
  });
});

