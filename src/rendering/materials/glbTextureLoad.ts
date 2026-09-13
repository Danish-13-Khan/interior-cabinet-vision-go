import {
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Material,
  type Texture,
} from "three";
import type { GlbMaterialBuildContext } from "./glbMaterialBuildContext";
import { textureRepeatFromUvScaleMm } from "./materialScale";

const textureLoader = new TextureLoader();

/** UV placement authored on the finish; matches the curated box path in CuratedPbrMaterial. */
export type UvPlacement = {
  uvRotationDeg?: number;
  uvOffsetU?: number;
  uvOffsetV?: number;
};

export function loadSlotTexture(
  url: string | undefined,
  uvScaleMm: number,
  build: GlbMaterialBuildContext,
  colorSpace: boolean,
  placement: UvPlacement = {},
) {
  if (!url) return undefined;
  const texture = textureLoader.load(url);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.center.set(0.5, 0.5);
  texture.rotation = ((placement.uvRotationDeg ?? 0) * Math.PI) / 180;
  texture.offset.set(placement.uvOffsetU ?? 0, placement.uvOffsetV ?? 0);
  texture.anisotropy = build.anisotropy;
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function asMeshMaterials(material: Material | Material[]) {
  return Array.isArray(material) ? material : [material];
}

export function disposeMaterialTextures(material: Material) {
  const maybe = material as Material & {
    map?: Texture | null;
    normalMap?: Texture | null;
    roughnessMap?: Texture | null;
    aoMap?: Texture | null;
    bumpMap?: Texture | null;
  };
  maybe.map?.dispose();
  maybe.normalMap?.dispose();
  maybe.roughnessMap?.dispose();
  maybe.aoMap?.dispose();
  maybe.bumpMap?.dispose();
}
