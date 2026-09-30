import { describe, expect, it } from "vitest";
import { Mesh, BoxGeometry, MeshStandardMaterial, Scene } from "three";
import { assetIdForImport } from "./identity";
import { buildTriangleGlb } from "./minimalGlb";
import { bboxMinY, normalizeImportedObject } from "./normalize";
import { runImport } from "./runImport";
import { decideImportRuntime } from "./spike";
import { declareWebpIfNeeded, fallbackTextureMime, storedTextureMime } from "./webpTexture";
import { Document } from "@gltf-transform/core";
import { guessObjUnit, guessUnitFromSize, sizesUnderUnits } from "./units";
import { dimensionsForPlacement } from "../../domain/livingRoom/modelImportClient";

const settings = { unit: "m" as const, upAxis: "y" as const, optimizerVersion: 0 };

describe("import units", () => {
  it("uses the size table boundaries, including inches and feet", () => {
    expect(guessUnitFromSize(9.99)).toBe("m");
    expect(guessUnitFromSize(10)).toBe("ft");
    expect(guessUnitFromSize(29.99)).toBe("ft");
    expect(guessUnitFromSize(30)).toBe("cm");
    expect(guessUnitFromSize(599.99)).toBe("cm");
    expect(guessUnitFromSize(600)).toBe("mm");
  });

  it("reads an OBJ exporter comment before the size table", () => {
    expect(guessObjUnit("# Blender 4.2\nv 0 0 0\n", 2)).toBe("m");
    expect(guessObjUnit("# SketchUp\nv 0 0 0\n", 100)).toBe("in");
    expect(guessObjUnit("# Maya\nv 0 0 0\n", 100)).toBe("cm");
    expect(guessObjUnit("# 3ds Max\nv 0 0 0\n", 5)).toBe("m");
    expect(sizesUnderUnits(120).cm).toBe(1200);
    expect(sizesUnderUnits(120).in).toBeCloseTo(3048);
  });
});

describe("import identity and size", () => {
  it("keeps the asset id stable until the unit changes", async () => {
    const files = [{ name: "sofa.glb", bytes: buildTriangleGlb([-1, 0, 0, 1, 0, 0, 0, 1, 0]) }];
    const first = await assetIdForImport(files, settings);
    const again = await assetIdForImport(files, settings);
    const centimetres = await assetIdForImport(files, { ...settings, unit: "cm" });
    expect(again).toBe(first);
    expect(centimetres).not.toBe(first);
    expect(first.startsWith("file:")).toBe(true);
    const ordered = await assetIdForImport([
      { name: "b.glb", bytes: files[0].bytes },
      { name: "a.glb", bytes: files[0].bytes },
    ], settings);
    const reversed = await assetIdForImport([
      { name: "a.glb", bytes: files[0].bytes },
      { name: "b.glb", bytes: files[0].bytes },
    ], settings);
    expect(reversed).toBe(ordered);
  });

  it("puts a fixture on the floor and measures a 2 m side as about 2000 mm", async () => {
    const scene = new Scene();
    scene.add(new Mesh(new BoxGeometry(2, 1, 0.5), new MeshStandardMaterial()));
    scene.position.set(3, 4, 5);
    const size = normalizeImportedObject(scene, { scaleToMm: 1000, rotateZUp: false });
    expect(bboxMinY(scene)).toBeCloseTo(0, 4);
    expect(size.widthMm).toBeCloseTo(2000, 0);
    expect(size.heightMm).toBeCloseTo(1000, 0);

    const imported = await runImport({
      files: [{ name: "sofa.glb", bytes: buildTriangleGlb([-1, 0, -0.4, 1, 0, 0.4, 0, 0.8, 0]) }],
      settings,
    });
    expect(imported.dimensions.widthMm).toBeCloseTo(2000, 0);
    expect(imported.dimensions.heightMm).toBeCloseTo(800, 0);
    expect(dimensionsForPlacement({ widthMm: 1000, heightMm: 1000, depthMm: 1000 }, imported.dimensions)).toEqual({
      widthMm: 1000, heightMm: 1000, depthMm: 1000,
    });
    expect(dimensionsForPlacement(null, imported.dimensions).widthMm).toBeCloseTo(2000, 0);
  });

  it("imports on the main thread when the worker cannot decode or draw textures", () => {
    expect(decideImportRuntime({ worker: true, imageBitmap: true, offscreen2d: true })).toBe("worker");
    expect(decideImportRuntime({ worker: true, imageBitmap: false, offscreen2d: true })).toBe("main");
    expect(decideImportRuntime({ worker: true, imageBitmap: true, offscreen2d: false })).toBe("main");
  });

  it("declares WebP only when the encoded blob is WebP", async () => {
    expect(storedTextureMime("image/png", true)).toBe("image/png");
    expect(storedTextureMime("image/webp", false)).toBe("image/jpeg");
    expect(storedTextureMime("image/webp", true)).toBe("image/webp");
    expect(storedTextureMime("image/webp", false, "image/png")).toBe("image/png");
    const document = new Document();
    declareWebpIfNeeded(document, "image/jpeg");
    expect(document.getRoot().listExtensionsUsed().map((extension) => extension.extensionName)).not.toContain("EXT_texture_webp");
    declareWebpIfNeeded(document, "image/webp");
    expect(document.getRoot().listExtensionsUsed().map((extension) => extension.extensionName)).toContain("EXT_texture_webp");
  });

  it("keeps PNG (alpha) textures as PNG when WebP is not available", () => {
    expect(fallbackTextureMime("image/png")).toBe("image/png");
    expect(fallbackTextureMime("image/webp")).toBe("image/png");
    expect(fallbackTextureMime("image/jpeg")).toBe("image/jpeg");
    expect(storedTextureMime("image/jpeg", false, "image/jpeg")).toBe("image/jpeg");
  });
});
