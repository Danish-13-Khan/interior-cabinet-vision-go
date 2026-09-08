import { describe, expect, it } from "vitest";
import { inflateSync } from "zlib";
import { kenneyItemId } from "../catalog";
import {
  createEmptyInteriorProject,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  type InteriorObjectEntity,
} from "../interiorProject";
import { createLivingRoomStarterProject } from ".";
import {
  commitFinishImportDraft,
  finishMapUrl,
  findManufacturerFinish,
  getManufacturerCatalogue,
  listManufacturerCatalogues,
  manufacturerFinishesCompatibleWithSelectionSlot,
  stageManufacturerFinish,
} from "./index";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

function decodePngRgba(dataUrl: string): [number, number, number, number] {
  const bytes = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
  let offset = 8;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IDAT") {
      const raw = inflateSync(data);
      return [raw[1]!, raw[2]!, raw[3]!, raw[4]!];
    }
    offset += 12 + length;
  }
  throw new Error("PNG has no IDAT");
}

describe("manufacturer catalogues (M6.3)", () => {
  it("lists curated catalogues with project-owned map bytes", () => {
    const catalogues = listManufacturerCatalogues();
    expect(catalogues.length).toBeGreaterThanOrEqual(2);
    for (const catalogue of catalogues) {
      expect(catalogue.finishes.length).toBeGreaterThan(0);
      for (const finish of catalogue.finishes) {
        expect(finish.mapDataUrl.startsWith("data:image/")).toBe(true);
        expect(finish.mapDataUrl.includes("https://")).toBe(false);
      }
    }
  });

  it("uses PBR-valid neutral normal and grayscale roughness seed maps", () => {
    const finish = findManufacturerFinish("mfr:studio-laminates:warm-oak")!.finish;
    expect(finish.normalMapDataUrl).not.toBe(finish.mapDataUrl);
    expect(finish.roughnessMapDataUrl).not.toBe(finish.mapDataUrl);
    expect(decodePngRgba(finish.normalMapDataUrl!)).toEqual([128, 128, 255, 255]);
    expect(decodePngRgba(finish.roughnessMapDataUrl!)).toEqual([168, 168, 168, 255]);
  });

  it("stages a finish and commits colour, kind, and provenance into the project", () => {
    const finishId = "mfr:studio-laminates:warm-oak";
    const match = findManufacturerFinish(finishId);
    expect(match).toBeTruthy();
    const draft = stageManufacturerFinish(finishId);
    expect(draft.fileName).toBe("Warm Oak Laminate");
    expect(draft.color).toBe("#c4a574");
    expect(draft.kind).toBe("laminate");
    expect(draft.manufacturerId).toBe("mfr:studio-laminates");
    expect(draft.catalogueFinishId).toBe(finishId);
    expect(draft.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(draft.brand).toBe("Studio Laminates");
    expect(draft.productCode).toBe("SL-WO-284");
    expect(draft.sheetWidthMm).toBe(2800);
    expect(draft.normalMapDataUrl?.startsWith("data:image/")).toBe(true);

    const project = createEmptyInteriorProject({
      id: "m63",
      name: "M6.3",
      now: "2026-09-07T00:00:00.000Z",
    });
    const painted = commitFinishImportDraft(project, draft, { floor: true });
    const material = painted.materials.find((item) => item.id === "finish-import-1");
    expect(material?.name).toBe("Warm Oak Laminate");
    expect(material?.kind).toBe("laminate");
    expect(material?.color).toBe("#c4a574");
    expect(material?.extensions?.createdBy).toBe("manufacturer-catalogue");
    expect(material?.extensions?.manufacturerId).toBe("mfr:studio-laminates");
    expect(material?.extensions?.catalogueFinishId).toBe(finishId);
    expect(material?.extensions?.brand).toBe("Studio Laminates");
    expect(material?.extensions?.productCode).toBe("SL-WO-284");
    expect(material?.extensions?.sheetWidthMm).toBe(2800);
    expect(typeof material?.extensions?.normalMapUrl).toBe("string");
    expect(typeof material?.extensions?.roughnessMapUrl).toBe("string");
    expect(finishMapUrl(material!)?.startsWith("data:image/")).toBe(true);

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(painted)).document;
    const again = reopened.materials.find((item) => item.id === "finish-import-1");
    expect(again?.color).toBe("#c4a574");
    expect(finishMapUrl(again!)?.startsWith("data:image/")).toBe(true);
    expect(again?.extensions?.catalogueFinishId).toBe(finishId);
  });

  it("rejects unknown finish ids", () => {
    expect(() => stageManufacturerFinish("mfr:missing:finish")).toThrow(/not available/);
  });

  it("filters catalogue finishes and blocks incompatible selection paint", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-07T00:00:00.000Z" });
    const sofa: InteriorObjectEntity = {
      id: "sofa",
      roomId: source.activeRoomId,
      kind: "furniture",
      category: "seating",
      catalogItemId: kenneyItemId("loungeSofa"),
      name: "Sofa",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 2200, heightMm: 850, depthMm: 900 },
      materialSlots: { upholstery: LIVING_ROOM_MATERIAL_IDS.oatmealFabric, legs: LIVING_ROOM_MATERIAL_IDS.charcoalMetal },
      parameters: {},
    };

    const laminates = getManufacturerCatalogue("mfr:studio-laminates")!.finishes;
    const compatible = manufacturerFinishesCompatibleWithSelectionSlot(
      laminates,
      [sofa],
      "upholstery",
    );
    expect(compatible).toEqual([]);

    const draft = stageManufacturerFinish("mfr:studio-laminates:warm-oak");
    const project = { ...source, objects: [sofa] };
    expect(() => commitFinishImportDraft(project, draft, {
      selection: { objectIds: ["sofa"], slotName: "upholstery" },
    })).toThrow(/not compatible/);
    expect(project.objects[0]?.materialSlots.upholstery).toBe(sofa.materialSlots.upholstery);
    expect(project.materials.some((material) => material.id.startsWith("finish-import-"))).toBe(false);
  });
});
