import { describe, expect, it } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { fbxNormalizeOptions, fbxScaleToMm } from "./loaders/fbx";
import { objTextureWarnings } from "./loaders/obj";
import { unsupportedImportMessage } from "./messages";
import { normalizeImportedObject } from "./normalize";
import { runImport } from "./runImport";

describe("FBX and OBJ import", () => {
  it("scales a centimetre FBX to millimetres without rotating the root again", () => {
    const root = new Group();
    root.userData.unitScaleFactor = 1;
    root.rotation.x = -Math.PI / 2;
    root.add(new Mesh(new BoxGeometry(100, 40, 20), new MeshStandardMaterial()));
    const options = fbxNormalizeOptions(root);
    expect(options.rotateZUp).toBe(false);
    expect(fbxScaleToMm(1)).toBe(10);
    const size = normalizeImportedObject(root, options);
    // The loader's -90° X is baked once: the 20 cm Z side becomes 200 mm of height, not a second turn.
    expect(size.widthMm).toBeCloseTo(1000, 0);
    expect(size.heightMm).toBeCloseTo(200, 0);
    expect(size.depthMm).toBeCloseTo(400, 0);
  });

  it("warns on missing OBJ textures and still imports the mesh", async () => {
    const obj = `# Blender\nmtllib sofa.mtl\nv 0 0 0\nv 2 0 0\nv 0 1 0\nf 1 2 3\n`;
    const mtl = "newmtl fabric\nmap_Kd fabric.png\nmap_Kd missing.png\n";
    expect(objTextureWarnings(obj, mtl, [{ name: "fabric.png" }])).toEqual(["Missing texture missing.png."]);
    const imported = await runImport({
      files: [
        { name: "sofa.obj", bytes: new TextEncoder().encode(obj).buffer },
        { name: "sofa.mtl", bytes: new TextEncoder().encode(mtl).buffer },
        { name: "fabric.png", bytes: new Uint8Array([1, 2, 3]).buffer },
      ],
      settings: { unit: "m", upAxis: "y", optimizerVersion: 0 },
      honorFileUnits: true,
    });
    expect(imported.dimensions.widthMm).toBeCloseTo(2000, 0);
    expect(imported.warnings[0]).toBe("Missing texture missing.png.");
    expect(unsupportedImportMessage("chair.max")).toMatch(/FBX or glTF/);
    expect(unsupportedImportMessage("chair.stl")).toMatch(/Unsupported file/);
  });
});
