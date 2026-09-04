import { describe, expect, it } from "vitest";
import {
  instantiateLKitchenCatalogTemplate,
  L_KITCHEN_CATALOG_TEMPLATE_ID,
  lookupBuiltInCatalogTemplate,
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
const NOW = "2026-09-04T12:30:00.000Z";
const APPLIANCE_IDS = [
  "kenney:hood-modern",
  "kenney:kitchen-fridge",
  "kenney:kitchen-microwave",
  "kenney:kitchen-sink",
  "kenney:kitchen-stove-electric",
];

describe("Phase 5 L Kitchen template", () => {
  it("registers appliances, thumbnail, and kitchen category", () => {
    expect(catalog.catalogVersion).toBe("2026.09.7");
    const template = lookupBuiltInCatalogTemplate(L_KITCHEN_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("L Kitchen");
    expect(template.category).toBe("kitchen");
    expect(template.objects.map((object) => object.catalogItemId).sort()).toEqual(APPLIANCE_IDS);
    expect(template.room).toEqual({ widthMm: 6000, depthMm: 4500, heightMm: 2800 });
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.objectKey).toBe("catalog/templates/l-kitchen-v1.png");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(L_KITCHEN_CATALOG_TEMPLATE_ID)).toHaveLength(5);
  });

  it("instantiates L runs with corner, fillers, countertops, and review camera", () => {
    const project = instantiateLKitchenCatalogTemplate({
      projectId: "lk-phase5",
      projectName: "Phase 5 L Kitchen",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(L_KITCHEN_CATALOG_TEMPLATE_ID);
    expect(project.rooms[0]?.roomType).toBe("kitchen");
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 6000, heightMm: 2800, depthMm: 4500,
    });
    for (const id of APPLIANCE_IDS) {
      expect(project.objects.some((object) => object.catalogItemId === id)).toBe(true);
    }
    const cabinets = project.objects.filter((object) => object.kind === "cabinet");
    expect(cabinets.length).toBeGreaterThanOrEqual(8);
    const types = new Set(
      cabinets.map((object) => readCabinetIdentity(object)?.cabinetType).filter(Boolean),
    );
    expect(types.has("tall")).toBe(true);
    expect(types.has("base")).toBe(true);
    expect(types.has("drawer")).toBe(true);
    expect(types.has("wall")).toBe(true);
    expect(types.has("corner")).toBe(true);
    expect(cabinets.some((object) => object.extensions?.cornerPlacement)).toBe(true);
    const fillers = cabinets.filter(isCabinetRunFiller);
    expect(fillers.length).toBeGreaterThanOrEqual(4);
    const base = cabinets.find((object) => readCabinetIdentity(object)?.cabinetType === "base");
    expect(cabinetRunForObject(base!)?.fillersEnabled).toBe(true);
    const nodes = compileLivingRoomScene(project).nodes;
    expect(countertopTouchesCabinet(nodes, base!.id)).toBe(true);
    const tops = nodes.filter((node) => node.metadata.role === "countertop");
    expect(tops.length).toBeGreaterThanOrEqual(2);
    expect(project.renderSettings.lightingRecipeId).toBe("neutral-studio");
    expect(project.cameras.some((camera) => camera.isDefault && camera.name === "Run review")).toBe(true);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);

    const second = instantiateLKitchenCatalogTemplate({
      projectId: "lk-phase5-b", projectName: "Second L Kitchen", now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.objects.map((object) => object.id).sort()).not.toEqual(
      project.objects.map((object) => object.id).sort(),
    );
  });

  it("keeps L-run offsets after fillers and clears the corner", () => {
    const project = instantiateLKitchenCatalogTemplate({
      projectId: "lk-offsets", projectName: "L Offset Check", now: NOW,
    });
    const tall = project.objects.find((object) =>
      readCabinetIdentity(object)?.cabinetType === "tall" && !isCabinetRunFiller(object)
    )!;
    const backMeta = cabinetRunForObject(tall)!;
    expect(backMeta.startAlongMm).toBe(2620);
    const rightBases = project.objects.filter((object) =>
      readCabinetIdentity(object)?.cabinetType === "base"
      && !isCabinetRunFiller(object)
      && cabinetRunForObject(object)?.wallId !== backMeta.wallId
    );
    expect(rightBases.length).toBe(2);
    const rightMeta = cabinetRunForObject(rightBases[0]!)!;
    expect(rightMeta.startAlongMm).toBe(1020);
    const corner = project.objects.find((object) =>
      readCabinetIdentity(object)?.cabinetType === "corner"
    )!;
    const nearestRight = [...rightBases].sort((a, b) =>
      Math.hypot(a.position.x - corner.position.x, a.position.z - corner.position.z)
      - Math.hypot(b.position.x - corner.position.x, b.position.z - corner.position.z)
    )[0]!;
    const separation = Math.hypot(
      nearestRight.position.x - corner.position.x,
      nearestRight.position.z - corner.position.z,
    );
    const minClear = (nearestRight.dimensions.widthMm + corner.dimensions.widthMm) / 2 - 50;
    expect(separation).toBeGreaterThan(minClear);
  });

  it("preserves L kitchen catalog identity across serialize/reopen", () => {
    const project = instantiateLKitchenCatalogTemplate({
      projectId: "lk-roundtrip", projectName: "Roundtrip L Kitchen", now: NOW,
    });
    const json = serializeInteriorProjectFile(project);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(L_KITCHEN_CATALOG_TEMPLATE_ID);
    expect(reopened.rooms[0]?.roomType).toBe("kitchen");
    expect(reopened.objects.filter((object) => object.kind === "cabinet").length)
      .toBe(project.objects.filter((object) => object.kind === "cabinet").length);
    for (const id of APPLIANCE_IDS) {
      expect(reopened.objects.some((object) => object.catalogItemId === id)).toBe(true);
    }
    expect(reopened.objects.some((object) =>
      readCabinetIdentity(object)?.cabinetType === "corner"
    )).toBe(true);
  });
});
