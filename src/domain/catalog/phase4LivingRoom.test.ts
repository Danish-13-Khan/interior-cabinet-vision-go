import { describe, expect, it } from "vitest";
import {
  catalogSwatchesForSlot,
  instantiateLivingRoomCatalogTemplate,
  isCanonicalCatalogSnapshot,
  LIVING_ROOM_CATALOG_TEMPLATE_ID,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
  lookupBuiltInCatalogTemplate,
  paintObjectSlotFromCatalog,
  templateModelAssetIds,
  validateCatalogManifest,
} from ".";
import { serializeInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import { validateInteriorProject } from "../interiorProject";
import { createObjectRenderBinding } from "../livingRoom";
import manifest from "../../../public/catalog/builtin-catalog.v1.json";
import type { CatalogManifest } from "./types";

const catalog = manifest as CatalogManifest;
const NOW = "2026-09-04T12:00:00.000Z";

describe("Phase 4 Living Room vertical slice", () => {
  it("registers the Living Room template with eight Kenney objects and a thumbnail", () => {
    expect(catalog.catalogVersion).toBe("2026.09.8");
    expect(catalog.templates.length).toBeGreaterThanOrEqual(1);
    const template = lookupBuiltInCatalogTemplate(LIVING_ROOM_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("Living Room");
    expect(template.objects).toHaveLength(8);
    expect(template.objects.map((object) => object.catalogItemId).sort()).toEqual([
      "kenney:cabinet-television",
      "kenney:lamp-round-floor",
      "kenney:lounge-chair",
      "kenney:lounge-sofa",
      "kenney:potted-plant",
      "kenney:rug-rectangle",
      "kenney:table-coffee",
      "kenney:television-modern",
    ].sort());
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.kind).toBe("image");
    expect(thumb?.objectKey).toBe("catalog/templates/living-room-v1.png");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(LIVING_ROOM_CATALOG_TEMPLATE_ID)).toHaveLength(8);
  });

  it("instantiates a fresh editable project with catalog versions and material snapshots", () => {
    const project = instantiateLivingRoomCatalogTemplate({
      projectId: "lr-phase4",
      projectName: "Phase 4 Living Room",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(LIVING_ROOM_CATALOG_TEMPLATE_ID);
    expect(project.objects).toHaveLength(8);
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 5200,
      heightMm: 2700,
      depthMm: 4200,
    });
    const sofa = project.objects.find((object) => object.catalogItemId === "kenney:lounge-sofa")!;
    expect(sofa.catalogItemVersion).toBe(1);
    expect(sofa.materialSlots.upholstery).toBeTruthy();
    expect(sofa.materialSlots.legs).toBeTruthy();
    const oatmeal = lookupBuiltInCatalogMaterial("material:core:fabric-oatmeal:v1")!;
    const snap = project.materials.find((material) => material.id === sofa.materialSlots.upholstery)!;
    expect(isCanonicalCatalogSnapshot(snap, oatmeal)).toBe(true);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    for (const object of project.objects) {
      expect(createObjectRenderBinding(object).strategy).toBe("glb");
      expect(createObjectRenderBinding(object).modelUrl).toBeTruthy();
    }

    const second = instantiateLivingRoomCatalogTemplate({
      projectId: "lr-phase4-b",
      projectName: "Second Living Room",
      now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.objects.map((object) => object.id).sort()).not.toEqual(
      project.objects.map((object) => object.id).sort(),
    );
  });

  it("changes upholstery independently from legs and keeps TV/plant locks", () => {
    const project = instantiateLivingRoomCatalogTemplate({ projectId: "lr-finishes", now: NOW });
    const sofa = project.objects.find((object) => object.catalogItemId === "kenney:lounge-sofa")!;
    const legsBefore = sofa.materialSlots.legs;
    const sofaItem = lookupBuiltInCatalogItem("kenney:lounge-sofa")!;
    const oliveChoices = catalogSwatchesForSlot(sofaItem.materialSlots.upholstery!);
    expect(oliveChoices.some((material) => material.id === "material:core:fabric-olive:v1")).toBe(true);

    const painted = paintObjectSlotFromCatalog(project, {
      objectId: sofa.id,
      slotName: "upholstery",
      catalogMaterialId: "material:core:fabric-olive:v1",
    });
    const nextSofa = painted.objects.find((object) => object.id === sofa.id)!;
    expect(nextSofa.materialSlots.upholstery).not.toBe(sofa.materialSlots.upholstery);
    expect(nextSofa.materialSlots.legs).toBe(legsBefore);
    const olive = painted.materials.find((material) => material.id === nextSofa.materialSlots.upholstery)!;
    expect(olive.extensions?.catalogMaterialId).toBe("material:core:fabric-olive:v1");

    const tv = project.objects.find((object) => object.catalogItemId === "kenney:television-modern")!;
    expect(() =>
      paintObjectSlotFromCatalog(project, {
        objectId: tv.id,
        slotName: "screen",
        catalogMaterialId: "material:core:fabric-olive:v1",
      }),
    ).toThrow(/locked/);
    const plant = project.objects.find((object) => object.catalogItemId === "kenney:potted-plant")!;
    expect(() =>
      paintObjectSlotFromCatalog(project, {
        objectId: plant.id,
        slotName: "foliage",
        catalogMaterialId: "material:core:fabric-olive:v1",
      }),
    ).toThrow(/locked/);
  });

  it("preserves catalog identity and material snapshots across serialize/reopen", () => {
    const project = instantiateLivingRoomCatalogTemplate({
      projectId: "lr-roundtrip",
      projectName: "Roundtrip Living Room",
      now: NOW,
    });
    const painted = paintObjectSlotFromCatalog(project, {
      objectId: project.objects.find((object) => object.catalogItemId === "kenney:lounge-sofa")!.id,
      slotName: "upholstery",
      catalogMaterialId: "material:core:fabric-olive:v1",
    });
    const json = serializeInteriorProjectFile(painted);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(LIVING_ROOM_CATALOG_TEMPLATE_ID);
    expect(reopened.objects).toHaveLength(8);
    const sofa = reopened.objects.find((object) => object.catalogItemId === "kenney:lounge-sofa")!;
    expect(sofa.catalogItemVersion).toBe(1);
    const upholstery = reopened.materials.find((material) => material.id === sofa.materialSlots.upholstery)!;
    expect(upholstery.extensions?.catalogMaterialId).toBe("material:core:fabric-olive:v1");
    expect(upholstery.color).toBe("#6a6e52");
  });
});
