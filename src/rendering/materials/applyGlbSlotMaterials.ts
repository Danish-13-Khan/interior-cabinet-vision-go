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
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";
import { createPbrMaterialDescriptor } from "../materials/createPbrMaterial";
import { textureRepeatFromUvScaleMm } from "./materialScale";
import { resolveMaterialTextureUrls } from "./resolveMaterialTextureUrls";

const textureLoader = new TextureLoader();

function loadTexture(url: string | undefined, uvScaleMm: number, mode: RenderMode, colorSpace: boolean) {
  if (!url) return undefined;
  const texture = textureLoader.load(url);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.anisotropy = getRenderModeQuality(mode).anisotropy;
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
) {
  const pbr = createPbrMaterialDescriptor(compiled, mode, {
    primitiveId: primitiveHint,
  });
  const textureUrls = resolveMaterialTextureUrls(compiled);
  const curatedMap = loadTexture(textureUrls.map, compiled.uvScaleMm, mode, true);
  const curatedNormal = loadTexture(textureUrls.normalMap, compiled.uvScaleMm, mode, false);
  const curatedRoughness = loadTexture(textureUrls.roughnessMap, compiled.uvScaleMm, mode, false);
  const curatedAo = loadTexture(textureUrls.aoMap, compiled.uvScaleMm, mode, false);
  return new MeshPhysicalMaterial({
    color: new Color(pbr.color),
    map: curatedMap ?? pbr.maps.map,
    normalMap: curatedNormal,
    roughnessMap: curatedRoughness,
    aoMap: curatedAo,
    bumpMap: curatedMap ? undefined : pbr.maps.bumpMap,
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

/** Tint GLB meshes from project materialSlots via named mesh groups. */
export function applyGlbSlotMaterials(
  root: Object3D,
  args: {
    materialGroups: Record<string, string>;
    materialBindings: Record<string, string>;
    materials: Map<string, CompiledMaterial>;
    renderMode: RenderMode;
    castShadow: boolean;
    receiveShadow: boolean;
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
    if (!materialId) return;
    const compiled = args.materials.get(materialId);
    if (!compiled) return;
    const next = buildPhysicalMaterial(compiled, args.renderMode, child.name);
    for (const previous of asMeshMaterials(child.material)) {
      disposeMaterialTextures(previous);
      previous.dispose();
    }
    child.material = next;
  });
}
