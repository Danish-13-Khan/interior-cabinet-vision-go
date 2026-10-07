import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIVING_ROOM_MATERIAL_IDS } from "../../domain/livingRoom/materials";
import { defaultUvScaleMmForMaterial } from "../../domain/livingRoom/materialUvScale";
import { SCANNED_MATERIAL_SETS } from "../../domain/livingRoom/scannedMaterialSets";
import { MATERIAL_ASSET_MANIFEST } from "./materialManifest";
import { SCANNED_TEXTURE_URLS } from "./materialSetSources";
import { TEXTURE_ASSET_MANIFEST } from "./textureManifest";

const ROOT = join(process.cwd());
const KTX_MAGIC = Buffer.from([0xab, 0x4b, 0x54, 0x58]);

describe("scanned material sets", () => {
  it("keeps the KTX2, the source PNG, and the tile size on one material id", () => {
    for (const set of SCANNED_MATERIAL_SETS) {
      expect(defaultUvScaleMmForMaterial(set.materialId), set.materialId).toBe(set.tileMm);
      const asset = MATERIAL_ASSET_MANIFEST.find((entry) => entry.id === set.materialId);
      expect(asset?.uvScaleMm, set.materialId).toBe(set.tileMm);
      for (const slot of ["color", "normal", "roughness"] as const) {
        const textureId = set[slot];
        const url = SCANNED_TEXTURE_URLS[textureId];
        expect(url, textureId).toMatch(/\.ktx2$/);
        const assetKey = url.slice(1);
        const file = join(ROOT, "public", assetKey);
        const header = readFileSync(file).subarray(0, 4);
        expect(header.equals(KTX_MAGIC), file).toBe(true);
        expect(TEXTURE_ASSET_MANIFEST.find((entry) => entry.id === textureId)?.assetKey).toBe(assetKey);
      }
      const source = join(ROOT, "render-sources/materials", set.materialId);
      expect(existsSync(join(source, "color.png")), source).toBe(true);
      expect(existsSync(join(source, "normal.png")), source).toBe(true);
      expect(existsSync(join(source, "roughness.png")), source).toBe(true);
      const meta = JSON.parse(readFileSync(join(source, "source.json"), "utf8")) as {
        polyhaven: string;
        tileMm: number;
        license: string;
      };
      expect(meta).toMatchObject({ polyhaven: set.polyhaven, tileMm: set.tileMm, license: "CC0" });
    }
  });

  it("reuses the oatmeal hessian scan for the wool rug", () => {
    const oatmeal = SCANNED_MATERIAL_SETS.find(
      (set) => set.materialId === LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    );
    const rug = MATERIAL_ASSET_MANIFEST.find(
      (entry) => entry.id === LIVING_ROOM_MATERIAL_IDS.woolRug,
    );
    expect(defaultUvScaleMmForMaterial(LIVING_ROOM_MATERIAL_IDS.woolRug)).toBe(269);
    expect(rug?.uvScaleMm).toBe(269);
    expect(rug?.colorMapId).toBe(oatmeal?.color);
    expect(rug?.normalMapId).toBe(oatmeal?.normal);
    expect(rug?.roughnessMapId).toBe(oatmeal?.roughness);
  });
});
