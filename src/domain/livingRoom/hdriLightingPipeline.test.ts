import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  applyLivingRoomLightingRecipe,
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  environmentAssetIdForRecipe,
  LIVING_ROOM_LIGHTING_RECIPES,
  lightformerFallbackForRecipe,
  resolveEnvironmentLightingQuality,
} from ".";
import {
  getEnvironmentForLightingRecipe,
  isEnvironmentAssetAvailable,
  resolveEnvironmentDrawState,
} from "../../rendering/assets/assetRegistry";

const NOW = "2026-08-12T15:00:00.000Z";

describe("HDRI lighting pipeline", () => {
  it("resolves each lighting recipe to an environment preset", () => {
    for (const recipe of LIVING_ROOM_LIGHTING_RECIPES) {
      const envId = environmentAssetIdForRecipe(recipe.id);
      expect(envId).toBe(`env:${recipe.id}`);
      const asset = getEnvironmentForLightingRecipe(recipe.id);
      expect(asset?.id).toBe(envId);
      expect(asset?.lightingRecipeId).toBe(recipe.id);
      expect(isEnvironmentAssetAvailable(asset?.id)).toBe(true);
      expect(resolveEnvironmentDrawState(recipe.id).url).toContain("/environments/");
      expect(lightformerFallbackForRecipe(recipe.id).key).toBe(recipe.id);
    }
  });

  it("falls back safely when an HDRI asset is marked unavailable", () => {
    const state = resolveEnvironmentDrawState("unknown-recipe");
    expect(state.definition).toBeNull();
    expect(state.available).toBe(false);
    expect(state.url).toBeNull();
    expect(state.fallbackRequired).toBe(true);
    expect(lightformerFallbackForRecipe("unknown-recipe").key).toBe("neutral-studio");
  });

  it("uses lighter preview and richer hero environment settings", () => {
    const preview = resolveEnvironmentLightingQuality("preview", "standard");
    const hero = resolveEnvironmentLightingQuality("hero", "presentation");
    const client = resolveEnvironmentLightingQuality("hero", "client-preview");
    const draftHero = resolveEnvironmentLightingQuality("hero", "draft");
    expect(preview.resolution).toBeLessThanOrEqual(128);
    expect(hero.resolution).toBeGreaterThanOrEqual(256);
    expect(hero.intensityScale).toBeGreaterThan(preview.intensityScale);
    expect(hero.shadowRadius).toBeGreaterThan(preview.shadowRadius);
    expect(hero.preferHdri).toBe(true);
    expect(client.shadowMapSize).toBeLessThan(hero.shadowMapSize);
    expect(client.shadowMapSize).toBeGreaterThan(draftHero.shadowMapSize);
    expect(draftHero.preferHdri).toBe(false);
  });

  it("keeps render settings backward compatible and compiles lightingRecipeId", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const warmed = applyLivingRoomLightingRecipe(project, "daylight");
    const scene = compileLivingRoomScene(warmed);
    expect(scene.lightingRecipeId).toBe("daylight");

    const serialized = serializeInteriorProjectFile(warmed, NOW);
    const loaded = loadInteriorProjectFile(serialized);
    expect(loaded.document.renderSettings.lightingRecipeId).toBe("daylight");
    expect(JSON.stringify(serialized)).not.toContain("environments/daylight.hdr");
    expect(JSON.stringify(serialized)).not.toContain("env:daylight");
  });
});
