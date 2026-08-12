import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  type LightEntity,
  type MaterialEntity,
} from "../interiorProject";
import {
  applyLivingRoomStyle,
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  getActiveLivingRoomStyleId,
  LIVING_ROOM_STYLE_PRESETS,
  resolveLivingRoomEnvironment,
} from ".";

const NOW = "2026-08-11T21:00:00.000Z";

describe("living-room interior style system", () => {
  it("defines complete and distinct reusable style presets", () => {
    expect(LIVING_ROOM_STYLE_PRESETS.map((style) => style.id)).toEqual([
      "warm-contemporary",
      "nordic-light",
      "moody-walnut",
    ]);
    expect(new Set(LIVING_ROOM_STYLE_PRESETS.map((style) => style.environment.backgroundColor)).size).toBe(3);
    expect(LIVING_ROOM_STYLE_PRESETS.every((style) => Object.keys(style.materialRecipes).length === 9)).toBe(true);
    expect(LIVING_ROOM_STYLE_PRESETS.every((style) => style.colorManagement.toneMapping === "aces-filmic")).toBe(true);
  });

  it("applies materials, lighting, environment, and exposure without mutating the source", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const beforeColor = source.materials.find((material) => material.id === "lr-material-wall-warm-white")!.color;
    const styled = applyLivingRoomStyle(source, "moody-walnut");

    expect(getActiveLivingRoomStyleId(styled)).toBe("moody-walnut");
    expect(styled.renderSettings).toMatchObject({
      exposure: 0.92,
      lightingRecipeId: "warm-evening",
    });
    expect(styled.lights.filter((light) => light.enabled).every((light) => light.parameters.recipeId === "warm-evening")).toBe(true);
    expect(styled.materials.find((material) => material.id === "lr-material-wall-warm-white")!.color).toBe("#817d73");
    expect(resolveLivingRoomEnvironment(styled).backgroundColor).toBe("#54575a");
    expect(source.materials.find((material) => material.id === "lr-material-wall-warm-white")!.color).toBe(beforeColor);
  });

  it("preserves custom materials, custom lights, and stable standard light IDs", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const customMaterial: MaterialEntity = {
      id: "custom-material",
      name: "Client Accent",
      kind: "custom",
      color: "#ff5500",
      roughness: 0.5,
      metalness: 0,
      opacity: 1,
    };
    const customLight: LightEntity = {
      id: "custom-light",
      roomId: source.activeRoomId,
      name: "Client Pendant",
      kind: "point",
      position: { x: 0, y: 2200, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color: "#ffffff",
      intensity: 2,
      enabled: true,
      parameters: { custom: true },
    };
    const withCustom = {
      ...source,
      materials: [...source.materials, customMaterial],
      lights: [...source.lights, customLight],
    };
    const standardIds = source.lights.map((light) => light.id).sort();
    const styled = applyLivingRoomStyle(withCustom, "nordic-light");

    expect(styled.materials).toContainEqual(customMaterial);
    expect(styled.lights).toContainEqual(customLight);
    expect(styled.lights.filter((light) => light.parameters.recipeId).map((light) => light.id).sort()).toEqual(standardIds);
  });

  it("is idempotent and compiles each visual language deterministically", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const nordic = applyLivingRoomStyle(source, "nordic-light");
    const repeated = applyLivingRoomStyle(nordic, "nordic-light");
    const moody = applyLivingRoomStyle(source, "moody-walnut");
    const nordicScene = compileLivingRoomScene(nordic);
    const moodyScene = compileLivingRoomScene(moody);

    expect(repeated).toEqual(nordic);
    expect(nordicScene.style.id).toBe("nordic-light");
    expect(nordicScene.style.colorManagement.outputColorSpace).toBe("srgb");
    expect(nordicScene.fingerprint).not.toBe(moodyScene.fingerprint);
  });

  it("round-trips the complete style snapshot through canonical JSON", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const styled = applyLivingRoomStyle(source, "moody-walnut");
    const before = compileLivingRoomScene(styled);
    const loaded = loadInteriorProjectFile(serializeInteriorProjectFile(styled, NOW));
    const after = compileLivingRoomScene(loaded.document);

    expect(getActiveLivingRoomStyleId(loaded.document)).toBe("moody-walnut");
    expect(after.style).toEqual(before.style);
    expect(after.fingerprint).toBe(before.fingerprint);
  });
});

