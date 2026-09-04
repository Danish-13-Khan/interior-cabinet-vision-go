import { describe, expect, it } from "vitest";
import {
  BATHROOM_CATALOG_TEMPLATE_ID,
  catalogSwatchesForSlot,
  instantiateBathroomCatalogTemplate,
  isCanonicalCatalogSnapshot,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
  lookupBuiltInCatalogTemplate,
  paintObjectSlotFromCatalog,
  templateModelAssetIds,
  validateCatalogManifest,
} from ".";
import { BATHROOM_TILE_CATALOG_MATERIAL_ID } from "./bathroomSurfaces";
import { serializeInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import { validateInteriorProject } from "../interiorProject";
import {
  createObjectRenderBinding,
  inspectLivingRoomPlan,
  isBlockingLivingRoomPlanIssue,
} from "../livingRoom";
import manifest from "../../../public/catalog/builtin-catalog.v1.json";
import type { CatalogManifest } from "./types";

const catalog = manifest as CatalogManifest;
const NOW = "2026-09-04T14:45:00.000Z";

const BATHROOM_ITEM_IDS = [
  "kenney:bathroom-mirror",
  "kenney:bathroom-sink",
  "kenney:shower",
  "kenney:toilet",
];

describe("Phase 5 Bathroom template", () => {
  it("registers a furnished bathroom with Kenney fixtures and a thumbnail", () => {
    expect(catalog.catalogVersion).toBe("2026.09.10");
    const template = lookupBuiltInCatalogTemplate(BATHROOM_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("Bathroom");
    expect(template.category).toBe("bathroom");
    expect(template.objects).toHaveLength(4);
    expect(template.objects.map((object) => object.catalogItemId).sort()).toEqual(
      [...BATHROOM_ITEM_IDS].sort(),
    );
    expect(template.room).toEqual({ widthMm: 4200, depthMm: 3600, heightMm: 2700 });
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.kind).toBe("image");
    expect(thumb?.objectKey).toBe("catalog/templates/bathroom-v1.png");
    expect(lookupBuiltInCatalogMaterial(BATHROOM_TILE_CATALOG_MATERIAL_ID)?.tags).toContain("tile");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(BATHROOM_CATALOG_TEMPLATE_ID)).toHaveLength(4);
  });

  it("instantiates a fresh bathroom project with catalog versions and GLB bindings", () => {
    const project = instantiateBathroomCatalogTemplate({
      projectId: "ba-phase5",
      projectName: "Phase 5 Bathroom",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(BATHROOM_CATALOG_TEMPLATE_ID);
    expect(project.rooms[0]?.roomType).toBe("bathroom");
    expect(project.rooms[0]?.name).toBe("Bathroom");
    expect(project.objects).toHaveLength(4);
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 4200,
      heightMm: 2700,
      depthMm: 3600,
    });
    const floorId = project.rooms[0]?.extensions?.floorMaterialId as string;
    const floor = project.materials.find((material) => material.id === floorId)!;
    expect(floor.extensions?.catalogMaterialId).toBe(BATHROOM_TILE_CATALOG_MATERIAL_ID);
    expect(project.walls.every((wall) => wall.materialId === floorId)).toBe(true);
    expect(project.openings.map((opening) => opening.kind).sort()).toEqual(["door", "window"]);
    const sink = project.objects.find((object) => object.catalogItemId === "kenney:bathroom-sink")!;
    expect(sink.catalogItemVersion).toBe(1);
    expect(sink.materialSlots.ceramic).toBeTruthy();
    const ceramic = lookupBuiltInCatalogMaterial("material:core:ceramic-white:v1")!;
    const snap = project.materials.find((material) => material.id === sink.materialSlots.ceramic)!;
    expect(isCanonicalCatalogSnapshot(snap, ceramic)).toBe(true);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    const planIssues = inspectLivingRoomPlan(project);
    expect(planIssues.filter(isBlockingLivingRoomPlanIssue)).toEqual([]);
    expect(planIssues.filter((issue) => issue.code === "opening-clearance")).toEqual([]);
    for (const object of project.objects) {
      expect(createObjectRenderBinding(object).strategy).toBe("glb");
      expect(createObjectRenderBinding(object).modelUrl).toBeTruthy();
    }

    const second = instantiateBathroomCatalogTemplate({
      projectId: "ba-phase5-b",
      projectName: "Second Bathroom",
      now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.objects.map((object) => object.id).sort()).not.toEqual(
      project.objects.map((object) => object.id).sort(),
    );
  });

  it("recolors sink ceramic without touching hardware", () => {
    const project = instantiateBathroomCatalogTemplate({ projectId: "ba-finishes", now: NOW });
    const sink = project.objects.find((object) => object.catalogItemId === "kenney:bathroom-sink")!;
    const hardwareBefore = sink.materialSlots.hardware;
    const sinkItem = lookupBuiltInCatalogItem("kenney:bathroom-sink")!;
    const ceramicChoices = catalogSwatchesForSlot(sinkItem.materialSlots.ceramic!);
    expect(ceramicChoices.some((material) => material.id === "material:core:planter-terracotta:v1")).toBe(true);

    const painted = paintObjectSlotFromCatalog(project, {
      objectId: sink.id,
      slotName: "ceramic",
      catalogMaterialId: "material:core:planter-terracotta:v1",
    });
    const nextSink = painted.objects.find((object) => object.id === sink.id)!;
    expect(nextSink.materialSlots.ceramic).not.toBe(sink.materialSlots.ceramic);
    expect(nextSink.materialSlots.hardware).toBe(hardwareBefore);
    const terracotta = painted.materials.find(
      (material) => material.id === nextSink.materialSlots.ceramic,
    )!;
    expect(terracotta.extensions?.catalogMaterialId).toBe("material:core:planter-terracotta:v1");
  });

  it("preserves bathroom catalog identity and finishes across serialize/reopen", () => {
    const project = instantiateBathroomCatalogTemplate({
      projectId: "ba-roundtrip",
      projectName: "Roundtrip Bathroom",
      now: NOW,
    });
    const painted = paintObjectSlotFromCatalog(project, {
      objectId: project.objects.find((object) => object.catalogItemId === "kenney:bathroom-sink")!.id,
      slotName: "ceramic",
      catalogMaterialId: "material:core:planter-terracotta:v1",
    });
    const json = serializeInteriorProjectFile(painted);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(BATHROOM_CATALOG_TEMPLATE_ID);
    expect(reopened.objects).toHaveLength(4);
    expect(reopened.rooms[0]?.roomType).toBe("bathroom");
    const floorId = reopened.rooms[0]?.extensions?.floorMaterialId as string;
    const floor = reopened.materials.find((material) => material.id === floorId)!;
    expect(floor.extensions?.catalogMaterialId).toBe(BATHROOM_TILE_CATALOG_MATERIAL_ID);
    expect(reopened.walls.every((wall) => wall.materialId === floorId)).toBe(true);
    const sink = reopened.objects.find((object) => object.catalogItemId === "kenney:bathroom-sink")!;
    const ceramic = reopened.materials.find((material) => material.id === sink.materialSlots.ceramic)!;
    expect(ceramic.extensions?.catalogMaterialId).toBe("material:core:planter-terracotta:v1");
    expect(ceramic.color).toBe("#b56b45");
  });
});
