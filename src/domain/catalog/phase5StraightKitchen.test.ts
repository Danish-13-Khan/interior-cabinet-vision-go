import { describe, expect, it } from "vitest";
import {
  instantiateStraightKitchenCatalogTemplate,
  lookupBuiltInCatalogTemplate,
  STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID,
  templateModelAssetIds,
  validateCatalogManifest,
} from ".";
import { readCabinetIdentity } from "../cabinetIdentity";
import { serializeInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import { validateInteriorProject } from "../interiorProject";
import { compileLivingRoomScene } from "../livingRoom";
import { countertopTouchesCabinet } from "../livingRoom/cabinetSceneRunExtras";
import { cabinetRunForObject, isCabinetRunFiller } from "../livingRoom/wardrobePlacement";
import manifest from "../../../public/catalog/builtin-catalog.v1.json";
import type { CatalogManifest } from "./types";

const catalog = manifest as CatalogManifest;
const NOW = "2026-09-04T12:00:00.000Z";
const APPLIANCE_IDS = [
  "kenney:hood-modern",
  "kenney:kitchen-fridge",
  "kenney:kitchen-sink",
  "kenney:kitchen-stove-electric",
];

describe("Phase 5 Straight Kitchen template", () => {
  it("registers appliances, thumbnail, and kitchen category", () => {
    expect(catalog.catalogVersion).toBe("2026.09.8");
    const template = lookupBuiltInCatalogTemplate(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("Straight Kitchen");
    expect(template.category).toBe("kitchen");
    expect(template.objects.map((object) => object.catalogItemId).sort()).toEqual(APPLIANCE_IDS);
    expect(template.room).toEqual({ widthMm: 6000, depthMm: 4000, heightMm: 2800 });
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.objectKey).toBe("catalog/templates/straight-kitchen-v1.png");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID)).toHaveLength(4);
  });

  it("instantiates smart run with fillers, countertop hosts, and review camera", () => {
    const project = instantiateStraightKitchenCatalogTemplate({
      projectId: "sk-phase5",
      projectName: "Phase 5 Straight Kitchen",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID);
    expect(project.rooms[0]?.roomType).toBe("kitchen");
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 6000, heightMm: 2800, depthMm: 4000,
    });
    for (const id of APPLIANCE_IDS) {
      expect(project.objects.some((object) => object.catalogItemId === id)).toBe(true);
    }
    const cabinets = project.objects.filter((object) => object.kind === "cabinet");
    expect(cabinets.length).toBeGreaterThanOrEqual(6);
    const types = new Set(
      cabinets.map((object) => readCabinetIdentity(object)?.cabinetType).filter(Boolean),
    );
    expect(types.has("tall")).toBe(true);
    expect(types.has("base")).toBe(true);
    expect(types.has("drawer")).toBe(true);
    expect(types.has("wall")).toBe(true);
    const fillers = cabinets.filter(isCabinetRunFiller);
    expect(fillers.length).toBeGreaterThanOrEqual(2);
    const base = cabinets.find((object) => readCabinetIdentity(object)?.cabinetType === "base");
    expect(cabinetRunForObject(base!)?.fillersEnabled).toBe(true);
    const nodes = compileLivingRoomScene(project).nodes;
    expect(countertopTouchesCabinet(nodes, base!.id)).toBe(true);
    expect(project.renderSettings.lightingRecipeId).toBe("neutral-studio");
    expect(project.cameras.some((camera) => camera.isDefault && camera.name === "Run review")).toBe(true);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);

    const second = instantiateStraightKitchenCatalogTemplate({
      projectId: "sk-phase5-b", projectName: "Second Kitchen", now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.objects.map((object) => object.id).sort()).not.toEqual(
      project.objects.map((object) => object.id).sort(),
    );
  });

  it("preserves kitchen catalog identity across serialize/reopen", () => {
    const project = instantiateStraightKitchenCatalogTemplate({
      projectId: "sk-roundtrip", projectName: "Roundtrip Kitchen", now: NOW,
    });
    const json = serializeInteriorProjectFile(project);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID);
    expect(reopened.rooms[0]?.roomType).toBe("kitchen");
    expect(reopened.objects.filter((object) => object.kind === "cabinet").length)
      .toBe(project.objects.filter((object) => object.kind === "cabinet").length);
    for (const id of APPLIANCE_IDS) {
      expect(reopened.objects.some((object) => object.catalogItemId === id)).toBe(true);
    }
  });
});
