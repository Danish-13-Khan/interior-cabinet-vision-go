import { Suspense, useEffect } from "react";
import { useTexture } from "@react-three/drei";
import {
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";
import { usePbrMaterial } from "../../rendering/loaders/usePbrMaterial";
import {
  hasCuratedTextureUrls,
  resolveMaterialTextureUrls,
  type MaterialTextureUrls,
} from "../../rendering/materials/resolveMaterialTextureUrls";
import { textureRepeatFromUvScaleMm } from "../../rendering/materials/materialScale";

function prepareTexture(
  texture: Texture,
  uvScaleMm: number,
  mode: RenderMode,
  colorSpace: boolean,
) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.anisotropy = getRenderModeQuality(mode).anisotropy;
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function ProceduralPbrMaterial({
  material,
  primitiveId,
  renderMode,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
}) {
  const pbr = usePbrMaterial(material, renderMode, primitiveId);
  return (
    <meshPhysicalMaterial
      color={pbr.color}
      map={pbr.maps.map}
      bumpMap={pbr.maps.bumpMap}
      bumpScale={pbr.bumpScale}
      roughness={pbr.roughness}
      metalness={pbr.metalness}
      opacity={pbr.opacity}
      transparent={pbr.transparent}
      depthWrite={pbr.depthWrite}
      transmission={pbr.transmission}
      thickness={pbr.thickness}
      ior={pbr.ior}
      clearcoat={pbr.clearcoat}
      clearcoatRoughness={pbr.clearcoatRoughness}
      sheen={pbr.sheen}
      sheenColor={pbr.sheenColor}
      sheenRoughness={pbr.sheenRoughness}
      envMapIntensity={pbr.envMapIntensity}
      specularIntensity={pbr.specularIntensity}
    />
  );
}

function CuratedPbrMaterial({
  material,
  primitiveId,
  renderMode,
  urls,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
  urls: MaterialTextureUrls;
}) {
  const pbr = usePbrMaterial(material, renderMode, primitiveId);
  const entries = (Object.entries(urls) as Array<[keyof MaterialTextureUrls, string | undefined]>)
    .filter((entry): entry is [keyof MaterialTextureUrls, string] => Boolean(entry[1]));
  const loaded = useTexture(entries.map(([, url]) => url));
  const list = Array.isArray(loaded) ? loaded : [loaded];
  const textures = Object.fromEntries(
    entries.map(([key], index) => [key, list[index]]),
  ) as Partial<Record<keyof MaterialTextureUrls, Texture>>;

  useEffect(() => {
    if (textures.map) prepareTexture(textures.map, material.uvScaleMm, renderMode, true);
    if (textures.normalMap) prepareTexture(textures.normalMap, material.uvScaleMm, renderMode, false);
    if (textures.roughnessMap) prepareTexture(textures.roughnessMap, material.uvScaleMm, renderMode, false);
    if (textures.aoMap) prepareTexture(textures.aoMap, material.uvScaleMm, renderMode, false);
  }, [material.uvScaleMm, renderMode, textures.aoMap, textures.map, textures.normalMap, textures.roughnessMap]);

  return (
    <meshPhysicalMaterial
      color={pbr.color}
      map={textures.map ?? pbr.maps.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      aoMap={textures.aoMap}
      bumpMap={textures.map ? undefined : pbr.maps.bumpMap}
      bumpScale={pbr.bumpScale}
      roughness={pbr.roughness}
      metalness={pbr.metalness}
      opacity={pbr.opacity}
      transparent={pbr.transparent}
      depthWrite={pbr.depthWrite}
      transmission={pbr.transmission}
      thickness={pbr.thickness}
      ior={pbr.ior}
      clearcoat={pbr.clearcoat}
      clearcoatRoughness={pbr.clearcoatRoughness}
      sheen={pbr.sheen}
      sheenColor={pbr.sheenColor}
      sheenRoughness={pbr.sheenRoughness}
      envMapIntensity={pbr.envMapIntensity}
      specularIntensity={pbr.specularIntensity}
    />
  );
}

/** Prefer curated file maps; fall back to procedural canvas maps. */
export function CompiledMaterialView({
  material,
  primitiveId,
  renderMode,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
}) {
  const urls = resolveMaterialTextureUrls(material);
  if (!hasCuratedTextureUrls(urls)) {
    return (
      <ProceduralPbrMaterial
        material={material}
        primitiveId={primitiveId}
        renderMode={renderMode}
      />
    );
  }
  return (
    <Suspense
      fallback={(
        <ProceduralPbrMaterial
          material={material}
          primitiveId={primitiveId}
          renderMode={renderMode}
        />
      )}
    >
      <CuratedPbrMaterial
        material={material}
        primitiveId={primitiveId}
        renderMode={renderMode}
        urls={urls}
      />
    </Suspense>
  );
}
