import { Group } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { ImportFile } from "../protocol";
import { extensionOf, missingTextureWarning } from "../messages";
import { attachFbxTextureLoader } from "./fbxTextures";

export function textureNamesIn(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(/^\s*map_\w+\s+(\S+)/gm)) {
    const base = match[1].split(/[/\\]/).pop();
    if (base) names.add(base);
  }
  return [...names];
}

export function objTextureWarnings(objText: string, mtlText: string, files: readonly { name: string }[]): string[] {
  const have = new Set(files.map((file) => file.name.toLowerCase()));
  return textureNamesIn(`${objText}\n${mtlText}`)
    .filter((name) => !have.has(name.toLowerCase()))
    .map(missingTextureWarning);
}

/** Parse OBJ and apply the MTL, including textures matched from the selected images. */
export async function parseObjFile(
  file: ImportFile,
  files: readonly { name: string; bytes: ArrayBuffer }[],
): Promise<{ scene: Group; textureWarnings: string[] }> {
  const text = new TextDecoder().decode(file.bytes);
  const mtl = files.find((item) => extensionOf(item.name) === "mtl");
  const session = attachFbxTextureLoader(files);
  const loader = new OBJLoader();
  if (mtl) {
    const materials = new MTLLoader(session.manager).parse(new TextDecoder().decode(mtl.bytes), "");
    materials.preload();
    loader.setMaterials(materials);
  }
  const scene = loader.parse(text);
  await session.ready();
  return { scene, textureWarnings: [...session.warnings()] };
}
