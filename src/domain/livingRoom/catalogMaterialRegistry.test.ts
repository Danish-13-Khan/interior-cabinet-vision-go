import { describe, expect, it } from "vitest";
import { instantiateLivingRoomCatalogTemplate } from "../catalog";
import { getMaterialAsset } from "../../rendering/assets/assetRegistry";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import {
  registryMaterialIdForCatalogId,
  resolveMaterialAssetId,
} from "./catalogMaterialRegistry";
import { compileLivingRoomScene } from "./sceneCompiler";

describe("catalogMaterialRegistry", () => {
  it("maps catalog seed ids to living-room registry assets", () => {
    expect(registryMaterialIdForCatalogId("material:core:wood-natural-oak:v1")).toBe(
      LIVING_ROOM_MATERIAL_IDS.naturalOak,
    );
    expect(registryMaterialIdForCatalogId("material:core:fabric-rug-wool:v1")).toBe(
      LIVING_ROOM_MATERIAL_IDS.woolRug,
    );
  });

  it("resolves proj snapshots via catalogMaterialId extension", () => {
    expect(
      resolveMaterialAssetId("proj-material-core-wood-natural-oak-v1", {
        extensions: { catalogMaterialId: "material:core:wood-natural-oak:v1" },
      }),
    ).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);
  });

  it("passes through unknown living-room ids", () => {
    expect(resolveMaterialAssetId(LIVING_ROOM_MATERIAL_IDS.naturalOak)).toBe(
      LIVING_ROOM_MATERIAL_IDS.naturalOak,
    );
  });

  it("compiles living-room template materials onto registry assets", () => {
    const project = instantiateLivingRoomCatalogTemplate({
      projectId: "lr-mat-alias",
      now: "2026-09-05T00:00:00.000Z",
    });
    const scene = compileLivingRoomScene(project);
    const catalogSnaps = project.materials.filter(
      (material) => typeof material.extensions?.catalogMaterialId === "string",
    );
    expect(catalogSnaps.length).toBeGreaterThan(0);
    for (const material of catalogSnaps) {
      const compiled = scene.materials.find((item) => item.id === material.id)!;
      expect(getMaterialAsset(compiled.materialAssetId)).toBeTruthy();
    }
  });
});
