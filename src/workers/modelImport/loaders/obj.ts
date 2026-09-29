import { Group } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { ImportFile } from "../protocol";
import { missingTextureWarning } from "../messages";

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

export function parseObjFile(file: ImportFile): Group {
  return new OBJLoader().parse(new TextDecoder().decode(file.bytes));
}
