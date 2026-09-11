import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import type {
  RenderMode,
  RenderModeQuality,
} from "../../domain/livingRoom/renderAssetContracts";
import { useModelViewPreviewQuality } from "../../rendering/ModelViewPreviewProfile";
import { usePbrMaterial } from "../../rendering/loaders/usePbrMaterial";
import {
  resolveCuratedBumpMap,
  resolveCuratedMapAnisotropy,
} from "../../rendering/materials/curatedMapQuality";
import { textureRepeatFromUvScaleMm } from "../../rendering/materials/materialScale";
import type { MaterialTextureUrls } from "../../rendering/materials/resolveMaterialTextureUrls";

function prepareTexture(
  texture: Texture,
  uvScaleMm: number,
  mode: RenderMode,
  colorSpace: boolean,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
  uvRotationDeg = 0,
  uvOffsetU = 0,
  uvOffsetV = 0,
) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.center.set(0.5, 0.5);
  texture.rotation = (uvRotationDeg * Math.PI) / 180;
  texture.offset.set(uvOffsetU, uvOffsetV);
  texture.anisotropy = resolveCuratedMapAnisotropy(mode, quality, modeQuality);
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  return texture;
}

type Slot = keyof MaterialTextureUrls;

/** Curated maps with per-material texture clones so shared URLs keep independent UV. */
export function CuratedPbrMaterial({
  material,
  primitiveId,
  renderMode,
  renderQuality,
  urls,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  urls: MaterialTextureUrls;
}) {
  const modelViewQuality = useModelViewPreviewQuality();
  const modeQuality = modelViewQuality
    ? resolveModelViewMaterialQuality(modelViewQuality)
    : undefined;
  const pbr = usePbrMaterial(material, renderMode, primitiveId, renderQuality);
  const entries = (Object.entries(urls) as Array<[Slot, string | undefined]>)
    .filter((entry): entry is [Slot, string] => Boolean(entry[1]));
  const loaded = useTexture(entries.map(([, url]) => url));
  const list = Array.isArray(loaded) ? loaded : [loaded];
  const shared = Object.fromEntries(
    entries.map(([key], index) => [key, list[index]]),
  ) as Partial<Record<Slot, Texture>>;

  const textures = useMemo(() => {
    const clones: Partial<Record<Slot, Texture>> = {};
    (Object.keys(shared) as Slot[]).forEach((key) => {
      const source = shared[key];
      if (source) clones[key] = source.clone();
    });
    return clones;
  }, [material.id, shared.map, shared.normalMap, shared.roughnessMap, shared.aoMap]);

  useEffect(() => () => {
    (Object.values(textures) as Texture[]).forEach((texture) => texture.dispose());
  }, [textures]);

  useEffect(() => {
    const offsetU = material.uvOffsetU ?? 0;
    const offsetV = material.uvOffsetV ?? 0;
    if (textures.map) {
      prepareTexture(
        textures.map, material.uvScaleMm, renderMode, true,
        renderQuality, modeQuality, material.uvRotationDeg, offsetU, offsetV,
      );
    }
    if (textures.normalMap) {
      prepareTexture(
        textures.normalMap, material.uvScaleMm, renderMode, false,
        renderQuality, modeQuality, material.uvRotationDeg, offsetU, offsetV,
      );
    }
    if (textures.roughnessMap) {
      prepareTexture(
        textures.roughnessMap, material.uvScaleMm, renderMode, false,
        renderQuality, modeQuality, material.uvRotationDeg, offsetU, offsetV,
      );
    }
    if (textures.aoMap) {
      prepareTexture(
        textures.aoMap, material.uvScaleMm, renderMode, false,
        renderQuality, modeQuality, material.uvRotationDeg, offsetU, offsetV,
      );
    }
  }, [
    material.uvOffsetU, material.uvOffsetV, material.uvRotationDeg, material.uvScaleMm,
    modeQuality, renderMode, renderQuality, textures,
  ]);

  return (
    <meshPhysicalMaterial
      color={pbr.color}
      map={textures.map ?? pbr.maps.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      aoMap={textures.aoMap}
      bumpMap={resolveCuratedBumpMap(textures.normalMap, pbr.maps.bumpMap)}
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
