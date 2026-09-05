import { describe, expect, it } from "vitest";
import { BUILTIN_CATALOG_MANIFEST as manifestJson } from "./builtinCatalogManifest";
import { validateCatalogManifest, type CatalogManifest } from ".";

function cloneManifest(): CatalogManifest {
  return structuredClone(manifestJson) as CatalogManifest;
}

describe("catalog template override compatibility", () => {
  it("rejects material overrides that violate slot kind/tag policy", () => {
    const withTemplate = cloneManifest();
    const sofa = withTemplate.items.find((item) => item.id === "kenney:lounge-sofa")!;
    const metal = withTemplate.materials.find((material) => material.id.includes("metal-charcoal"))!;
    withTemplate.files.push({
      id: "image:template:bad-finish:v1",
      kind: "image",
      role: "template-thumbnail",
      objectKey: "catalog/templates/bad-finish.png",
      mimeType: "image/png",
      byteSize: 10,
      contentHash: `sha256:${"c".repeat(64)}`,
    });
    withTemplate.templates.push({
      id: "template:core:bad-finish:v1",
      version: 1,
      name: "Bad Finish",
      category: "living-room",
      description: "x",
      images: { thumbnailId: "image:template:bad-finish:v1" },
      room: { widthMm: 4000, depthMm: 4000, heightMm: 2700 },
      objects: [
        {
          templateObjectId: "sofa",
          catalogItemId: sofa.id,
          catalogItemVersion: sofa.version,
          positionMm: { x: 0, y: 0, z: 0 },
          rotationY: 0,
          materialOverrides: { upholstery: metal.id },
        },
      ],
    });
    expect(
      validateCatalogManifest(withTemplate).some(
        (issue) => issue.code === "template-incompatible-material",
      ),
    ).toBe(true);
  });
});
