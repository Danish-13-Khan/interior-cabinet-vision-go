import { describe, expect, it } from "vitest";
import { LIVING_ROOM_LIGHTING_RECIPES, resolveRecipeLightSeed } from "./lighting";
import { createLivingRoomStarterProject } from "./preset";
import { compileLivingRoomScene } from "./sceneCompiler";

describe("recipe light seeds", () => {
  it("re-applies the current seed to a saved recipe light with a stale intensity", () => {
    const project = createLivingRoomStarterProject();
    const cove = project.lights.find((light) => light.name === "TV Feature Wall Cove" && light.parameters.recipeId === "neutral-studio")!;
    const stale = { ...cove, intensity: 0.85, color: "#000000" };
    const seed = LIVING_ROOM_LIGHTING_RECIPES.find((recipe) => recipe.id === "neutral-studio")!
      .lights.find((light) => light.name === cove.name)!;
    const resolved = resolveRecipeLightSeed(stale);
    expect(resolved.intensity).toBe(seed.intensity);
    expect(resolved.color).toBe(seed.color);
    expect(resolved.id).toBe(cove.id);
    expect(resolved.enabled).toBe(cove.enabled);
  });

  it("returns the same object when the seed already matches or the light is not a recipe light", () => {
    const project = createLivingRoomStarterProject();
    const recipeLight = project.lights.find((light) => typeof light.parameters.recipeId === "string")!;
    expect(resolveRecipeLightSeed(recipeLight)).toBe(recipeLight);
    const custom = { ...recipeLight, id: "custom", name: "My lamp", parameters: {} };
    expect(resolveRecipeLightSeed(custom)).toBe(custom);
  });

  it("compiles stale saved recipe lights with the current seeds", () => {
    const project = createLivingRoomStarterProject();
    const stale = {
      ...project,
      lights: project.lights.map((light) =>
        light.kind === "area" && typeof light.parameters.recipeId === "string" ? { ...light, intensity: 2.2 } : light),
    };
    const compiled = compileLivingRoomScene(stale).lights.filter((light) => light.kind === "area" && light.parameters.recipeId);
    expect(compiled.length).toBeGreaterThan(0);
    expect(compiled.every((light) => light.intensity !== 2.2)).toBe(true);
  });
});
