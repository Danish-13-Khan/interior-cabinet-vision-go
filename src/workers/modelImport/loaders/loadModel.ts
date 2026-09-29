import type { Object3D } from "three";
import type { ImportFile, ImportSettings } from "../protocol";
import { extensionOf } from "../messages";
import { parseGlb } from "./gltf";
import { fbxNormalizeOptions, parseFbx } from "./fbx";
import { objTextureWarnings, parseObjFile } from "./obj";
import { guessObjUnit, toMillimetres } from "../units";

export type LoadedModel = {
  scene: Object3D;
  scaleToMm: number;
  rotateZUp: boolean;
  warnings: string[];
};

function textOf(file: ImportFile | undefined): string {
  return file ? new TextDecoder().decode(file.bytes) : "";
}

export async function loadModel(files: readonly ImportFile[], settings: ImportSettings, honorFileUnits: boolean): Promise<LoadedModel> {
  const model = files.find((file) => ["glb", "gltf", "fbx", "obj"].includes(extensionOf(file.name)));
  if (!model) throw new Error("Select a GLB, FBX, or OBJ file.");
  const ext = extensionOf(model.name);
  if (ext === "glb" || ext === "gltf") {
    return {
      scene: await parseGlb(model.bytes),
      scaleToMm: toMillimetres(1, settings.unit),
      rotateZUp: settings.upAxis === "z",
      warnings: [],
    };
  }
  if (ext === "fbx") {
    const parsed = parseFbx(model.bytes);
    const fromFile = fbxNormalizeOptions(parsed.scene);
    return {
      scene: parsed.scene,
      scaleToMm: honorFileUnits ? fromFile.scaleToMm : toMillimetres(1, settings.unit),
      rotateZUp: false,
      warnings: parsed.warnings,
    };
  }
  const mtl = files.find((file) => extensionOf(file.name) === "mtl");
  const objText = textOf(model);
  const guessed = guessObjUnit(objText, 1);
  return {
    scene: parseObjFile(model),
    scaleToMm: honorFileUnits ? toMillimetres(1, guessed) : toMillimetres(1, settings.unit),
    rotateZUp: settings.upAxis === "z",
    warnings: objTextureWarnings(objText, textOf(mtl), files),
  };
}
