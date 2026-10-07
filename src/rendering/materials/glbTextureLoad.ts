import {
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Material,
  type Texture,
} from "three";
import type { GlbMaterialBuildContext } from "./glbMaterialBuildContext";
import { MaterialMapLoader, cachedMaterialMap } from "./materialMapLoader";
import { textureRepeatFromUvScaleMm } from "./materialScale";

const pngLoader = new TextureLoader();
const mapLoader = new MaterialMapLoader();

type MapSlot = "map" | "normalMap" | "roughnessMap" | "aoMap" | "metalnessMap";

/** UV placement authored on the finish; matches the curated box path in CuratedPbrMaterial. */
export type UvPlacement = {
  uvRotationDeg?: number;
  uvOffsetU?: number;
  uvOffsetV?: number;
};

function slotGeneration(material: Material) {
  return Number(material.userData.slotGeneration) || 0;
}

function placeTexture(
  texture: Texture,
  uvScaleMm: number,
  build: GlbMaterialBuildContext,
  colorSpace: boolean,
  placement: UvPlacement,
) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.center.set(0.5, 0.5);
  texture.rotation = ((placement.uvRotationDeg ?? 0) * Math.PI) / 180;
  texture.offset.set(placement.uvOffsetU ?? 0, placement.uvOffsetV ?? 0);
  texture.anisotropy = build.anisotropy;
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function assignSlot(material: MeshPhysicalMaterial, slot: MapSlot, texture: Texture) {
  if (slot === "map") material.map = texture;
  else if (slot === "normalMap") material.normalMap = texture;
  else if (slot === "roughnessMap") material.roughnessMap = texture;
  else if (slot === "aoMap") material.aoMap = texture;
  else material.metalnessMap = texture;
  material.needsUpdate = true;
}

export function loadSlotTexture(
  url: string | undefined,
  uvScaleMm: number,
  build: GlbMaterialBuildContext,
  colorSpace: boolean,
  placement: UvPlacement = {},
  bind?: { material: MeshPhysicalMaterial; slot: MapSlot },
) {
  if (!url) return undefined;
  const finish = (texture: Texture) => {
    placeTexture(texture, uvScaleMm, build, colorSpace, placement);
    if (bind) assignSlot(bind.material, bind.slot, texture);
    return texture;
  };
  if (!url.endsWith(".ktx2")) return finish(pngLoader.load(url));
  const cached = cachedMaterialMap(url);
  if (cached) return finish(cached.clone());
  const generation = bind ? slotGeneration(bind.material) : 0;
  mapLoader.load(url, (texture) => {
    if (bind && slotGeneration(bind.material) !== generation) return;
    finish(texture.clone());
  });
  return undefined;
}

export function attachSlotTextures(
  material: MeshPhysicalMaterial,
  urls: Partial<Record<MapSlot, string | undefined>>,
  uvScaleMm: number,
  build: GlbMaterialBuildContext,
  placement: UvPlacement = {},
) {
  (Object.keys(urls) as MapSlot[]).forEach((slot) => {
    loadSlotTexture(urls[slot], uvScaleMm, build, slot === "map", placement, { material, slot });
  });
}

export function asMeshMaterials(material: Material | Material[]) {
  return Array.isArray(material) ? material : [material];
}

export function disposeMaterialTextures(material: Material) {
  const maybe = material as Material & Partial<Record<MapSlot | "bumpMap", Texture | null>>;
  maybe.userData.slotGeneration = slotGeneration(material) + 1;
  maybe.map?.dispose();
  maybe.normalMap?.dispose();
  maybe.roughnessMap?.dispose();
  maybe.aoMap?.dispose();
  maybe.metalnessMap?.dispose();
  maybe.bumpMap?.dispose();
}
