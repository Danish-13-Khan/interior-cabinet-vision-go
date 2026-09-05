import { describe, expect, it } from "vitest";
import {
  BEDROOM_CATALOG_TEMPLATE_ID,
  catalogSwatchesForSlot,
  instantiateBedroomCatalogTemplate,
  isCanonicalCatalogSnapshot,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
  lookupBuiltInCatalogTemplate,
  paintObjectSlotFromCatalog,
  templateModelAssetIds,
  validateCatalogManifest,
} from ".";
import { serializeInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import { validateInteriorProject } from "../interiorProject";
import {
  createObjectRenderBinding,
  inspectLivingRoomPlan,
  isBlockingLivingRoomPlanIssue,
} from "../livingRoom";
import { BUILTIN_CATALOG_MANIFEST as manifest } from "./builtinCatalogManifest";
import type { CatalogManifest } from "./types";

const catalog = manifest as CatalogManifest;
const NOW = "2026-09-04T12:30:00.000Z";

const BEDROOM_ITEM_IDS = [
  "kenney:bed-double",
  "kenney:bookcase-open",
  "kenney:cabinet-bed-drawer-table",
  "kenney:cabinet-bed-drawer-table",
  "kenney:lamp-round-table",
  "kenney:pillow",
  "kenney:rug-rectangle",
];

describe("Phase 5 Bedroom template", () => {
  it("registers a furnished bedroom with Kenney pieces and a thumbnail", () => {
    expect(catalog.catalogVersion).toBe("2026.09.10");
    const template = lookupBuiltInCatalogTemplate(BEDROOM_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("Bedroom");
    expect(template.category).toBe("bedroom");
    expect(template.objects).toHaveLength(7);
    expect(template.objects.map((object) => object.catalogItemId).sort()).toEqual(
      [...BEDROOM_ITEM_IDS].sort(),
    );
    expect(template.room).toEqual({ widthMm: 5200, depthMm: 4200, heightMm: 2700 });
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.kind).toBe("image");
    expect(thumb?.objectKey).toBe("catalog/templates/bedroom-v1.png");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(BEDROOM_CATALOG_TEMPLATE_ID)).toHaveLength(6);
  });

  it("instantiates a fresh bedroom project with catalog versions and GLB bindings", () => {
    const project = instantiateBedroomCatalogTemplate({
      projectId: "br-phase5",
      projectName: "Phase 5 Bedroom",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(BEDROOM_CATALOG_TEMPLATE_ID);
    expect(project.rooms[0]?.roomType).toBe("bedroom");
    expect(project.rooms[0]?.name).toBe("Bedroom");
    expect(project.objects).toHaveLength(7);
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 5200,
      heightMm: 2700,
      depthMm: 4200,
    });
    expect(project.openings.map((opening) => opening.kind).sort()).toEqual(["door", "window"]);
    const bed = project.objects.find((object) => object.catalogItemId === "kenney:bed-double")!;
    expect(bed.catalogItemVersion).toBe(1);
    expect(bed.materialSlots.upholstery).toBeTruthy();
    expect(bed.materialSlots.bedding).toBeTruthy();
    const oatmeal = lookupBuiltInCatalogMaterial("material:core:fabric-oatmeal:v1")!;
    const snap = project.materials.find((material) => material.id === bed.materialSlots.upholstery)!;
    expect(isCanonicalCatalogSnapshot(snap, oatmeal)).toBe(true);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    const planIssues = inspectLivingRoomPlan(project);
    expect(planIssues.filter(isBlockingLivingRoomPlanIssue)).toEqual([]);
    expect(planIssues.filter((issue) => issue.code === "opening-clearance")).toEqual([]);
    for (const object of project.objects) {
      expect(createObjectRenderBinding(object).strategy).toBe("glb");
      expect(createObjectRenderBinding(object).modelUrl).toBeTruthy();
    }

    const second = instantiateBedroomCatalogTemplate({
      projectId: "br-phase5-b",
      projectName: "Second Bedroom",
      now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.objects.map((object) => object.id).sort()).not.toEqual(
      project.objects.map((object) => object.id).sort(),
    );
  });

  it("recolors bed upholstery without touching bedding or frame", () => {
    const project = instantiateBedroomCatalogTemplate({ projectId: "br-finishes", now: NOW });
    const bed = project.objects.find((object) => object.catalogItemId === "kenney:bed-double")!;
    const beddingBefore = bed.materialSlots.bedding;
    const frameBefore = bed.materialSlots.frame;
    const bedItem = lookupBuiltInCatalogItem("kenney:bed-double")!;
    const oliveChoices = catalogSwatchesForSlot(bedItem.materialSlots.upholstery!);
    expect(oliveChoices.some((material) => material.id === "material:core:fabric-olive:v1")).toBe(true);

    const painted = paintObjectSlotFromCatalog(project, {
      objectId: bed.id,
      slotName: "upholstery",
      catalogMaterialId: "material:core:fabric-olive:v1",
    });
    const nextBed = painted.objects.find((object) => object.id === bed.id)!;
    expect(nextBed.materialSlots.upholstery).not.toBe(bed.materialSlots.upholstery);
    expect(nextBed.materialSlots.bedding).toBe(beddingBefore);
    expect(nextBed.materialSlots.frame).toBe(frameBefore);
    const olive = painted.materials.find((material) => material.id === nextBed.materialSlots.upholstery)!;
    expect(olive.extensions?.catalogMaterialId).toBe("material:core:fabric-olive:v1");
  });

  it("preserves bedroom catalog identity and finishes across serialize/reopen", () => {
    const project = instantiateBedroomCatalogTemplate({
      projectId: "br-roundtrip",
      projectName: "Roundtrip Bedroom",
      now: NOW,
    });
    const painted = paintObjectSlotFromCatalog(project, {
      objectId: project.objects.find((object) => object.catalogItemId === "kenney:bed-double")!.id,
      slotName: "upholstery",
      catalogMaterialId: "material:core:fabric-olive:v1",
    });
    const json = serializeInteriorProjectFile(painted);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(BEDROOM_CATALOG_TEMPLATE_ID);
    expect(reopened.objects).toHaveLength(7);
    expect(reopened.rooms[0]?.roomType).toBe("bedroom");
    const bed = reopened.objects.find((object) => object.catalogItemId === "kenney:bed-double")!;
    const upholstery = reopened.materials.find((material) => material.id === bed.materialSlots.upholstery)!;
    expect(upholstery.extensions?.catalogMaterialId).toBe("material:core:fabric-olive:v1");
    expect(upholstery.color).toBe("#6a6e52");
  });
});
