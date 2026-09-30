import type { Object3D } from "three";
import type { ImportFile, ImportSettings, LengthUnit } from "../protocol";
import { extensionOf } from "../messages";
import { largestExtent } from "../normalize";
import { parseGlb } from "./gltf";
import { fbxNormalizeOptions, parseFbx } from "./fbx";
import { objTextureWarnings, parseObjFile } from "./obj";
import { guessObjUnit, toMillimetres, unitFromScale } from "../units";

export type LoadedModel = {
  scene: Object3D;
  scaleToMm: number;
  appliedUnit: LengthUnit | null;
  rotateZUp: boolean;
  warnings: string[];
};

function textOf(file: ImportFile | undefined): string {
  return file ? new TextDecoder().decode(file.bytes) : "";
}

function scaled(honorFileUnits: boolean, fileScale: number, fileUnit: LengthUnit | null, settings: ImportSettings) {
  if (!honorFileUnits) return { scaleToMm: toMillimetres(1, settings.unit), appliedUnit: settings.unit };
  return { scaleToMm: fileScale, appliedUnit: fileUnit };
}

export async function loadModel(files: readonly ImportFile[], settings: ImportSettings, honorFileUnits: boolean): Promise<LoadedModel> {
  const model = files.find((file) => ["glb", "gltf", "fbx", "obj"].includes(extensionOf(file.name)));
  if (!model) throw new Error("Select a GLB, FBX, or OBJ file.");
  const ext = extensionOf(model.name);
  if (ext === "glb" || ext === "gltf") {
    return {
      scene: await parseGlb(model.bytes),
      ...scaled(honorFileUnits, toMillimetres(1, "m"), "m", settings),
      rotateZUp: settings.upAxis === "z",
      warnings: [],
    };
  }
  if (ext === "fbx") {
    const parsed = await parseFbx(model.bytes, files);
    const fromFile = fbxNormalizeOptions(parsed.scene);
    const fileUnit = unitFromScale(fromFile.scaleToMm);
    return {
      scene: parsed.scene,
      ...scaled(honorFileUnits, fromFile.scaleToMm, fileUnit, settings),
      rotateZUp: false,
      warnings: parsed.warnings,
    };
  }
  const mtl = files.find((file) => extensionOf(file.name) === "mtl");
  const objText = textOf(model);
  const scene = parseObjFile(model);
  const guessed = guessObjUnit(objText, largestExtent(scene));
  return {
    scene,
    ...scaled(honorFileUnits, toMillimetres(1, guessed), guessed, settings),
    rotateZUp: settings.upAxis === "z",
    warnings: objTextureWarnings(objText, textOf(mtl), files),
  };
}
