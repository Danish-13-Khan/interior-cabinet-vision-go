import { describe, expect, it } from "vitest";
import { BUILTIN_CATALOG_MANIFEST as manifestJson } from "./builtinCatalogManifest";
import { validateCatalogManifest, type CatalogManifest } from ".";

function cloneManifest(): CatalogManifest {
  return structuredClone(manifestJson) as CatalogManifest;
}

describe("catalog schema structural validation", () => {
  it("rejects non-object manifests and bad enums", () => {
    expect(validateCatalogManifest(null).some((issue) => issue.code === "bad-shape")).toBe(true);
    const bad = cloneManifest();
    (bad.items[0] as { placement: string }).placement = "orbit";
    (bad.items[0] as { lifecycle: string }).lifecycle = "hidden";
    const issues = validateCatalogManifest(bad);
    expect(issues.some((issue) => issue.code === "bad-enum")).toBe(true);
  });

  it("rejects missing model refs and zero-primitive models", () => {
    const missingModel = cloneManifest();
    missingModel.items[0]!.modelAssetId = "model:missing";
    expect(
      validateCatalogManifest(missingModel).some((issue) => issue.code === "missing-model"),
    ).toBe(true);

    const zeroPrim = cloneManifest();
    const model = zeroPrim.files.find((file) => file.kind === "model");
    expect(model).toBeTruthy();
    if (model?.kind === "model") model.primitiveCount = 0;
    expect(validateCatalogManifest(zeroPrim).some((issue) => issue.code === "no-primitives")).toBe(
      true,
    );
  });

  it("rejects material texture and template eligibility failures", () => {
    const withMaterial = cloneManifest();
    withMaterial.materials.push({
      id: "material:core:test:v1",
      version: 1,
      name: "Test",
      kind: "fabric",
      tags: [],
      swatchColor: "#fff",
      baseColor: "#fff",
      roughness: 1,
      metalness: 0,
      opacity: 1,
      uvScaleMm: 100,
      textureAssetIds: { baseColor: "texture:missing:v1" },
      lifecycle: "active",
      visibleInPicker: true,
    });
    expect(
      validateCatalogManifest(withMaterial).some((issue) => issue.code === "missing-texture"),
    ).toBe(true);

    const withTemplate = cloneManifest();
    const blocked = withTemplate.items.find((item) => item.lifecycle === "blocked")!;
    withTemplate.files.push({
      id: "image:template:test:v1",
      kind: "image",
      role: "template-thumbnail",
      objectKey: "catalog/templates/test.png",
      mimeType: "image/png",
      byteSize: 10,
      contentHash: `sha256:${"a".repeat(64)}`,
    });
    withTemplate.templates.push({
      id: "template:core:test:v1",
      version: 1,
      name: "Test",
      category: "living-room",
      description: "x",
      images: { thumbnailId: "image:template:test:v1" },
      room: { widthMm: 4000, depthMm: 4000, heightMm: 2700 },
      objects: [
        {
          templateObjectId: "o1",
          catalogItemId: blocked.id,
          positionMm: { x: 0, y: 0, z: 0 },
          rotationY: 0,
        },
      ],
    });
    expect(
      validateCatalogManifest(withTemplate).some(
        (issue) => issue.code === "template-ineligible-item",
      ),
    ).toBe(true);
  });

  it("rejects template catalogItemVersion that does not match the item", () => {
    const withTemplate = cloneManifest();
    const sofa = withTemplate.items.find((item) => item.id === "kenney:lounge-sofa")!;
    sofa.visibility.templateEligible = true;
    withTemplate.files.push({
      id: "image:template:living:v1",
      kind: "image",
      role: "template-thumbnail",
      objectKey: "catalog/templates/living.png",
      mimeType: "image/png",
      byteSize: 10,
      contentHash: `sha256:${"b".repeat(64)}`,
    });
    withTemplate.templates.push({
      id: "template:core:living:v1",
      version: 1,
      name: "Living",
      category: "living-room",
      description: "x",
      images: { thumbnailId: "image:template:living:v1" },
      room: { widthMm: 4000, depthMm: 4000, heightMm: 2700 },
      objects: [
        {
          templateObjectId: "sofa",
          catalogItemId: sofa.id,
          catalogItemVersion: 2,
          positionMm: { x: 0, y: 0, z: 0 },
          rotationY: 0,
        },
      ],
    });
    const fixture = withTemplate.templates[withTemplate.templates.length - 1]!;
    const issues = validateCatalogManifest(withTemplate);
    expect(issues.some((issue) => issue.code === "template-item-version-mismatch")).toBe(true);

    fixture.objects[0]!.catalogItemVersion = sofa.version;
    expect(
      validateCatalogManifest(withTemplate).some(
        (issue) => issue.code === "template-item-version-mismatch",
      ),
    ).toBe(false);
  });

  it("returns issues without throwing for arbitrary malformed nested input", () => {
    const cases: unknown[] = [
      { ...cloneManifest(), licenses: [null] },
      { ...cloneManifest(), templates: [{}] },
      {
        ...cloneManifest(),
        templates: [{ id: "t", name: "T", category: "living-room", objects: [null] }],
      },
      {
        ...cloneManifest(),
        items: [{ ...cloneManifest().items[0], materialSlots: { upholstery: null } }],
      },
      {
        ...cloneManifest(),
        materials: [{ id: "m", name: "M", kind: "fabric", lifecycle: "active" }],
      },
      {
        ...cloneManifest(),
        items: [{ ...cloneManifest().items[0], images: null, visibility: null }],
      },
    ];
    for (const input of cases) {
      expect(() => validateCatalogManifest(input)).not.toThrow();
      const issues = validateCatalogManifest(input);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((issue) => issue.level === "error" || issue.level === "warn")).toBe(true);
    }
  });
});
