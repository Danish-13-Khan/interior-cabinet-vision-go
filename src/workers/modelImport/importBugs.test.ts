import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { readImportedGlb } from "../../domain/livingRoom/readMeasuredGlb";
import { createMemoryAssetBlobStore } from "../../domain/livingRoom/storedAssets";
import { assetIdForImport } from "./identity";
import { fbxScaleToMm } from "./loaders/fbx";
import { attachFbxTextureLoader } from "./loaders/fbxTextures";
import { importUnitChoice, unitFromScale } from "./units";
import { createImportGltfLoader, parseGlb } from "./loaders/gltf";
import { loadModel } from "./loaders/loadModel";
import { buildTriangleGlb } from "./minimalGlb";
import { bboxMinY, normalizeImportedObject } from "./normalize";
import { optimizeGlb } from "./optimize";

const settings = { unit: "m" as const, upAxis: "y" as const, optimizerVersion: 0 };

describe("import bug fixes", () => {
  it("bakes a nested group scale once and still sits on the floor", () => {
    const root = new Group();
    const group = new Group();
    group.scale.setScalar(2);
    group.position.set(0, 1, 0);
    group.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));
    root.add(group);
    const size = normalizeImportedObject(root, { scaleToMm: 1, rotateZUp: false });
    expect(size.heightMm).toBeCloseTo(2, 3);
    expect(size.widthMm).toBeCloseTo(2, 3);
    expect(bboxMinY(root)).toBeCloseTo(0, 3);
  });

  it("guesses OBJ units from the mesh extent instead of a hardcoded 1", async () => {
    const obj = "v 0 0 0\nv 200 0 0\nv 0 80 0\nf 1 2 3\n";
    const loaded = await loadModel(
      [{ name: "sofa.obj", bytes: new TextEncoder().encode(obj).buffer }],
      settings,
      true,
    );
    expect(loaded.appliedUnit).toBe("cm");
    expect(loaded.scaleToMm).toBe(10);
  });

  it("keeps a GLB in metres when a previous import's unit is still selected", async () => {
    const loaded = await loadModel(
      [{ name: "chair.glb", bytes: buildTriangleGlb([-1, 0, -0.5, 1, 0, 0.5, 0, 0.8, 0]) }],
      { ...settings, unit: "cm" },
      true,
    );
    expect(loaded.appliedUnit).toBe("m");
    expect(loaded.scaleToMm).toBe(1000);
  });

  it("puts the applied unit in the asset id so file units do not collide", async () => {
    const files = [{ name: "sofa.obj", bytes: new TextEncoder().encode("v 0 0 0\n").buffer }];
    const fileCm = await assetIdForImport(files, settings, { honorFileUnits: true, appliedUnit: "cm", scaleToMm: 10 });
    const staleFeet = await assetIdForImport(files, { ...settings, unit: "ft" }, { honorFileUnits: true, appliedUnit: "cm", scaleToMm: 10 });
    const explicitMetres = await assetIdForImport(files, settings, { honorFileUnits: false, appliedUnit: "m", scaleToMm: 1000 });
    expect(staleFeet).toBe(fileCm);
    expect(explicitMetres).not.toBe(fileCm);
  });

  it("does not statically import runImport from the client", () => {
    const clientPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../domain/livingRoom/modelImportClient.ts");
    const source = readFileSync(clientPath, "utf8");
    expect(source).not.toMatch(/import\s*\{[^}]*\brunImport\b/);
    expect(source).toMatch(/import\(\s*["'][^"']*runImport["']\s*\)/);
  });

  it("shows the OBJ unit that was applied, not the panel default", async () => {
    const obj = "v 0 0 0\nv 200 0 0\nv 0 80 0\nv 0 0 90\nf 1 2 3\nf 1 4 3\n";
    const store = createMemoryAssetBlobStore();
    const asset = await readImportedGlb(new File([obj], "sofa.obj"), store, "m", true);
    expect(asset.importUnit).toBe("cm");
    expect(asset.rawLargestSide).toBeCloseTo(200, 0);
    expect(asset.dimensions.widthMm).toBeCloseTo(2000, 0);
    expect(asset.dimensions.heightMm).toBeCloseTo(800, 0);
  });

  it("imports a meshopt GLB with the local decoders", async () => {
    const optimized = await optimizeGlb(buildTriangleGlb([-1, 0, 0, 1, 0, 0, 0, 1, 0]));
    const bytes = optimized.glb.buffer.slice(optimized.glb.byteOffset, optimized.glb.byteOffset + optimized.glb.byteLength);
    const scene = await parseGlb(bytes);
    let meshes = 0;
    scene.traverse((child) => { if ((child as Mesh).isMesh) meshes += 1; });
    expect(meshes).toBeGreaterThan(0);
    const loader = createImportGltfLoader();
    const draco = loader.dracoLoader as { decoderPaths?: { js?: string; wasm?: string } } | null;
    const base = `${import.meta.env.BASE_URL}draco/`;
    expect(draco?.decoderPaths?.wasm).toBe(`${base}draco_decoder.wasm`);
    expect(draco?.decoderPaths?.js).toBe(`${base}draco_wasm_wrapper.js`);
    expect(draco?.decoderPaths?.wasm ?? "").not.toMatch(/node_modules|\.vite|gstatic|googleapis|cdn\.jsdelivr/i);
    expect(loader.meshoptDecoder).toBeTruthy();
    loader.dracoLoader?.dispose();
  });

  it("loads an FBX image without document", async () => {
    const session = attachFbxTextureLoader([]);
    const handler = session.manager.getHandler(".png") as { load: (url: string) => unknown } | null;
    expect(handler).toBeTruthy();
    expect(() => handler!.load("data:image/png;base64,aaaa")).not.toThrow();
    await session.ready();
  });

  it("returns an empty texture for tga, dds, and tif instead of TextureLoader", () => {
    const session = attachFbxTextureLoader([]);
    const png = session.manager.getHandler(".png");
    for (const ext of [".tga", ".dds", ".tif", ".tiff"]) {
      const handler = session.manager.getHandler(ext) as { load: (url: string) => { image?: unknown; isTexture?: boolean } };
      expect(handler).toBeTruthy();
      expect(handler).not.toBe(png);
      const texture = handler.load(`fabric${ext}`);
      expect(texture.isTexture).toBe(true);
      expect(texture.image).toBeFalsy();
    }
    expect(session.warnings()).toEqual([
      "Unsupported texture fabric.tga.",
      "Unsupported texture fabric.dds.",
      "Unsupported texture fabric.tif.",
      "Unsupported texture fabric.tiff.",
    ]);
    const embedded = session.manager.getHandler(".tga") as { load: (url: string) => unknown };
    expect(() => embedded.load("blob:http://local/abc")).not.toThrow();
    expect(session.warnings()[session.warnings().length - 1]).toBe("Unsupported texture.");
  });


  it("imports a custom FBX unit scale without calling it metres", async () => {
    const fbx = [
      "; FBX 7.4.0 project file",
      "FBXHeaderExtension:  {",
      "\tFBXVersion: 7400",
      "}",
      "GlobalSettings:  {",
      "\tProperties70:  {",
      "\t\tP: \"UnitScaleFactor\", \"Number\", \"\", \"A\",2",
      "\t}",
      "}",
      "Objects:  {",
      "\tModel: 1, \"Model::A\", \"Null\" {",
      "\t}",
      "\tModel: 2, \"Model::B\", \"Null\" {",
      "\t}",
      "}",
      "Connections:  {",
      "\tC: \"OO\",1,0",
      "\tC: \"OO\",2,0",
      "}",
      "",
    ].join("\n");
    const loaded = await loadModel(
      [{ name: "part.fbx", bytes: new TextEncoder().encode(fbx).buffer }],
      settings,
      true,
    );
    expect(loaded.scaleToMm).toBe(20);
    expect(loaded.appliedUnit).toBeNull();
    expect(importUnitChoice(loaded.scaleToMm, loaded.appliedUnit ?? undefined).value).toBe("file");
  });

  it("does not label a nonstandard FBX unit scale as metres", () => {
    const scaleToMm = fbxScaleToMm(2);
    expect(scaleToMm).toBe(20);
    expect(unitFromScale(scaleToMm)).toBeNull();
    const choice = importUnitChoice(scaleToMm, "m");
    expect(choice.value).toBe("file");
    expect(choice.label).toBe("20 mm/unit");
    expect(choice.label).not.toBe("m");
    expect(importUnitChoice(fbxScaleToMm(100), "cm")).toEqual({ value: "m", label: null });
    expect(importUnitChoice(fbxScaleToMm(1), undefined)).toEqual({ value: "cm", label: null });
  });

  it("keeps a custom FBX scale out of the metres asset id", async () => {
    const files = [{ name: "part.fbx", bytes: new TextEncoder().encode("x").buffer }];
    const custom = await assetIdForImport(files, settings, { honorFileUnits: true, appliedUnit: null, scaleToMm: 20 });
    const staleFeet = await assetIdForImport(files, { ...settings, unit: "ft" }, { honorFileUnits: true, appliedUnit: null, scaleToMm: 20 });
    const metres = await assetIdForImport(files, settings, { honorFileUnits: false, appliedUnit: "m", scaleToMm: 1000 });
    expect(staleFeet).toBe(custom);
    expect(metres).not.toBe(custom);
  });

});
