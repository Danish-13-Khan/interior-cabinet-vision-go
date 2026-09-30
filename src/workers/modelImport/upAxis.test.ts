import { describe, expect, it } from "vitest";
import { assetIdForImport } from "./identity";
import { loadModel } from "./loaders/loadModel";
import { normalizeImportedObject } from "./normalize";

const settings = { unit: "m" as const, upAxis: "y" as const, optimizerVersion: 0 };
// 2 m wide, 0.5 m deep, 1 m tall when Z is up.
const obj = "v 0 0 0\nv 2 0 0\nv 0 0.5 0\nv 0 0 1\nf 1 2 3\nf 1 2 4\n";

function objFiles() {
  return [{ name: "cabinet.obj", bytes: new TextEncoder().encode(obj).buffer }];
}

describe("import up axis", () => {
  it("rotates a Z-up OBJ so its Z extent becomes the height", async () => {
    const loaded = await loadModel(objFiles(), { ...settings, upAxis: "z" }, false);
    expect(loaded.rotateZUp).toBe(true);
    const size = normalizeImportedObject(loaded.scene, { scaleToMm: loaded.scaleToMm, rotateZUp: loaded.rotateZUp });
    expect(size.widthMm).toBeCloseTo(2000, 0);
    expect(size.heightMm).toBeCloseTo(1000, 0);
    expect(size.depthMm).toBeCloseTo(500, 0);
  });

  it("keeps Y-up OBJ geometry as it is", async () => {
    const loaded = await loadModel(objFiles(), settings, false);
    expect(loaded.rotateZUp).toBe(false);
    const size = normalizeImportedObject(loaded.scene, { scaleToMm: loaded.scaleToMm, rotateZUp: loaded.rotateZUp });
    expect(size.heightMm).toBeCloseTo(500, 0);
  });

  it("gives a different asset id per up axis", async () => {
    const files = objFiles();
    const yUp = await assetIdForImport(files, settings);
    const zUp = await assetIdForImport(files, { ...settings, upAxis: "z" });
    expect(zUp).not.toBe(yUp);
    expect(await assetIdForImport(files, { ...settings, upAxis: "z" })).toBe(zUp);
  });
});
