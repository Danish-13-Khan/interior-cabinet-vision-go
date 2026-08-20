import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Material,
  type Object3D,
  TextureLoader,
  type Texture,
} from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";
import { resolveMaterialIdForMeshName } from "../../domain/livingRoom/glbMaterialGroups";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { ModelTextureUrls } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";
import { createPbrMaterialDescriptor } from "../materials/createPbrMaterial";
import { textureRepeatFromUvScaleMm } from "./materialScale";
import { resolveMaterialTextureUrls } from "./resolveMaterialTextureUrls";

const textureLoader = new TextureLoader();

function loadTexture(
  url: string | undefined,
  uvScaleMm: number,
  mode: RenderMode,
  colorSpace: boolean,
  quality?: RenderQuality,
) {
  if (!url) return undefined;
  const texture = textureLoader.load(url);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.anisotropy = getRenderModeQuality(mode, quality).anisotropy;
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function asMeshMaterials(material: Material | Material[]) {
  return Array.isArray(material) ? material : [material];
}

function disposeMaterialTextures(material: Material) {
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

function buildPhysicalMaterial(
  compiled: CompiledMaterial,
  mode: RenderMode,
  primitiveHint: string,
  quality?: RenderQuality,
) {
  const pbr = createPbrMaterialDescriptor(compiled, mode, {
    primitiveId: primitiveHint,
    quality,
  });
  const textureUrls = resolveMaterialTextureUrls(compiled);
  const curatedMap = loadTexture(textureUrls.map, compiled.uvScaleMm, mode, true, quality);
  const curatedNormal = loadTexture(textureUrls.normalMap, compiled.uvScaleMm, mode, false, quality);
  const curatedRoughness = loadTexture(textureUrls.roughnessMap, compiled.uvScaleMm, mode, false, quality);
  const curatedAo = loadTexture(textureUrls.aoMap, compiled.uvScaleMm, mode, false, quality);
  const map = curatedMap ?? pbr.maps.map;
  const maps = {
    ...(map ? { map } : {}),
    ...(curatedNormal ? { normalMap: curatedNormal } : {}),
    ...(curatedRoughness ? { roughnessMap: curatedRoughness } : {}),
    ...(curatedAo ? { aoMap: curatedAo } : {}),
    ...(!curatedMap && pbr.maps.bumpMap ? { bumpMap: pbr.maps.bumpMap } : {}),
  };
  return new MeshPhysicalMaterial({
    color: new Color(pbr.color),
    ...maps,
    bumpScale: pbr.bumpScale,
    roughness: pbr.roughness,
    metalness: pbr.metalness,
    opacity: pbr.opacity,
    transparent: pbr.transparent,
    depthWrite: pbr.depthWrite,
    transmission: pbr.transmission,
    thickness: pbr.thickness,
    ior: pbr.ior,
    clearcoat: pbr.clearcoat,
    clearcoatRoughness: pbr.clearcoatRoughness,
    sheen: pbr.sheen,
    sheenColor: new Color(pbr.sheenColor),
    sheenRoughness: pbr.sheenRoughness,
    envMapIntensity: pbr.envMapIntensity,
    specularIntensity: pbr.specularIntensity,
  });
}

function buildImportedMaterial(textures: ModelTextureUrls, mode: RenderMode, quality?: RenderQuality) {
  const map = loadTexture(textures.map, 1000, mode, true, quality);
  const normalMap = loadTexture(textures.normalMap, 1000, mode, false, quality);
  const roughnessMap = loadTexture(textures.roughnessMap, 1000, mode, false, quality);
  const metalnessMap = loadTexture(textures.metalnessMap, 1000, mode, false, quality);
  const maps = {
    ...(map ? { map } : {}),
    ...(normalMap ? { normalMap } : {}),
    ...(roughnessMap ? { roughnessMap } : {}),
    ...(metalnessMap ? { metalnessMap } : {}),
  };
  return new MeshPhysicalMaterial({ color: "white", roughness: 0.62, metalness: 0, ...maps });
}

/** Tint GLB meshes from project materialSlots via named mesh groups. */
export function applyGlbSlotMaterials(
  root: Object3D,
  args: {
    materialGroups: Record<string, string>;
    materialBindings: Record<string, string>;
    materials: Map<string, CompiledMaterial>;
    renderMode: RenderMode;
    renderQuality?: RenderQuality;
    castShadow: boolean;
    receiveShadow: boolean;
    importedTextures?: ModelTextureUrls;
  },
) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = args.castShadow;
    child.receiveShadow = args.receiveShadow;
    const materialId = resolveMaterialIdForMeshName(
      child.name,
      args.materialGroups,
      args.materialBindings,
    );
    if (!materialId && !args.importedTextures?.map) return;
    const compiled = materialId ? args.materials.get(materialId) : undefined;
    if (!compiled && !args.importedTextures?.map) return;
    const next = compiled ? buildPhysicalMaterial(compiled, args.renderMode, child.name, args.renderQuality)
      : buildImportedMaterial(args.importedTextures!, args.renderMode, args.renderQuality);
    for (const previous of asMeshMaterials(child.material)) {
      disposeMaterialTextures(previous);
      previous.dispose();
    }
    child.material = next;
  });
}
