import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../../public/catalog/builtin-catalog.v1.json";
import {
  assertValidCatalogManifest,
  isArchitectureStem,
  KENNEY_ARCHITECTURE_STEMS,
  kenneyItemId,
  validateCatalogManifest,
  type CatalogManifest,
} from ".";

const catalog = manifest as CatalogManifest;
const publicRoot = join(process.cwd(), "public");

describe("builtin catalog manifest", () => {
  it("validates schema with no errors", () => {
    const issues = validateCatalogManifest(catalog);
    expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
    expect(() => assertValidCatalogManifest(catalog)).not.toThrow();
  });

  it("contains all 140 Kenney items with unique ids", () => {
    expect(catalog.items).toHaveLength(140);
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.catalogVersion).toBe("2026.09.4");
    expect(catalog.licenses.some((license) => license.id === "cc0-1.0")).toBe(true);
    const ids = catalog.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(140);
  });

  it("blocks architecture stems and keeps non-curated items hidden", () => {
    expect(KENNEY_ARCHITECTURE_STEMS).toHaveLength(20);
    for (const stem of KENNEY_ARCHITECTURE_STEMS) {
      expect(isArchitectureStem(stem)).toBe(true);
      const item = catalog.items.find((candidate) => candidate.id === kenneyItemId(stem));
      expect(item?.lifecycle).toBe("blocked");
      expect(item?.category).toBe("architecture");
    }
    const blocked = catalog.items.filter((item) => item.lifecycle === "blocked");
    expect(blocked).toHaveLength(20);
    const eligible = catalog.items.filter((item) => item.visibility.templateEligible);
    expect(eligible.length).toBeGreaterThanOrEqual(30);
    expect(eligible.length).toBeLessThanOrEqual(35);
    for (const item of catalog.items) {
      if (!item.visibility.templateEligible && !item.visibility.objectBrowser) {
        expect(item.visibility).toEqual({ objectBrowser: false, templateEligible: false });
      }
    }
  });

  it("registers model files with hashes and on-disk paths", () => {
    const models = catalog.files.filter((file) => file.kind === "model");
    expect(models).toHaveLength(140);
    for (const file of models) {
      expect(file.contentHash.startsWith("sha256:")).toBe(true);
      expect(file.byteSize).toBeGreaterThan(0);
      expect(existsSync(join(publicRoot, file.objectKey))).toBe(true);
      if (file.kind === "model") {
        expect(file.primitiveCount).toBeGreaterThan(0);
        expect(file.nativeBoundsM.width).toBeGreaterThan(0);
      }
    }
  });

  it("keeps materials seeded and ships the Living Room template", () => {
    expect(catalog.catalogVersion).toBe("2026.09.4");
    expect(catalog.materials.length).toBeGreaterThanOrEqual(13);
    expect(catalog.templates).toHaveLength(1);
    expect(catalog.templates[0]?.id).toBe("template:core:living-room:v1");
  });

  it("exposes lounge sofa with curated dimensions and Kenney materials", () => {
    const sofa = catalog.items.find((item) => item.id === "kenney:lounge-sofa");
    expect(sofa?.name).toBe("Lounge Sofa");
    expect(sofa?.category).toBe("seating");
    expect(sofa?.lifecycle).toBe("active");
    expect(sofa?.visibility).toEqual({ objectBrowser: true, templateEligible: true });
    expect(sofa?.dimensionsMm).toEqual({ width: 2100, height: 850, depth: 900 });
    const model = catalog.files.find((file) => file.id === sofa?.modelAssetId);
    expect(model?.kind).toBe("model");
    if (model?.kind === "model") {
      expect(model.originalMaterialNames).toEqual(["carpet", "wood"]);
    }
    expect(sofa?.images.thumbnailId).toBe("image:kenney:lounge-sofa:iso-ne:v1");
  });
});
