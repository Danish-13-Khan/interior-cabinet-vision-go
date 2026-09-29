import { Group, type Object3D } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { SKINNED_FBX_WARNING } from "../messages";

/** FBXLoader stores centimetres-per-unit and already rotates Z-up. Do not rotate again. */
export function fbxScaleToMm(unitScaleFactor: unknown): number {
  const centimetres = typeof unitScaleFactor === "number" && unitScaleFactor > 0 ? unitScaleFactor : 1;
  return centimetres * 10;
}

export function fbxNormalizeOptions(root: Object3D): { scaleToMm: number; rotateZUp: false } {
  return { scaleToMm: fbxScaleToMm(root.userData.unitScaleFactor), rotateZUp: false };
}

export function parseFbx(bytes: ArrayBuffer): { scene: Group; warnings: string[] } {
  const scene = new FBXLoader().parse(bytes, "") as Group;
  const warnings: string[] = [];
  const animated = Array.isArray((scene as Group & { animations?: unknown[] }).animations)
    && (scene as Group & { animations?: unknown[] }).animations!.length > 0;
  let skinned = false;
  scene.traverse((child) => { if ((child as { isSkinnedMesh?: boolean }).isSkinnedMesh) skinned = true; });
  if (animated || skinned) warnings.push(SKINNED_FBX_WARNING);
  return { scene, warnings };
}
