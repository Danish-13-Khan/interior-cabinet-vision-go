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
import type { MaterialSlotPolicy } from "../../domain/catalog/types";
import { resolveMaterialIdForPrimitive, matchSlotFromMaterialOrMeshName } from "../../domain/catalog/materialSlotMatch";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, ModelTextureUrls } from "../../domain/livingRoom/renderAssetContracts";
import { createPbrMaterialDescriptor } from "../materials/createPbrMaterial";
import { resolveImportedGlbMaterialResponse } from "./importedGlbMaterialTuning";
import {
  persistGlbSourceMaterialName,
  readGlbSourceMaterialName,
} from "./glbSourceMaterial";
import { type GlbMaterialBuildContext, resolveGlbMaterialBuildContext } from "./glbMaterialBuildContext";
import { textureRepeatFromUvScaleMm } from "./materialScale";
import { resolveMaterialTextureUrls } from "./resolveMaterialTextureUrls";

export type { GlbMaterialBuildContext } from "./glbMaterialBuildContext";
export { resolveGlbMaterialBuildContext } from "./glbMaterialBuildContext";

const textureLoader = new TextureLoader();

function loadTexture(
  url: string | undefined,
  uvScaleMm: number,
  build: GlbMaterialBuildContext,
  colorSpace: boolean,
) {
  if (!url) return undefined;
  const texture = textureLoader.load(url);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.anisotropy = build.anisotropy;
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
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
  sourceName: string,
  primitiveId: string,
  build: GlbMaterialBuildContext,
) {
  const pbr = createPbrMaterialDescriptor(compiled, mode, {
    primitiveId,
    quality: build.quality,
    modeQuality: build.modeQuality,
    modelViewPreview: build.modelViewPreview,
  });
  const textureUrls = resolveMaterialTextureUrls(compiled);
  const curatedMap = loadTexture(textureUrls.map, compiled.uvScaleMm, build, true);
  const curatedNormal = loadTexture(textureUrls.normalMap, compiled.uvScaleMm, build, false);
  const curatedRoughness = loadTexture(textureUrls.roughnessMap, compiled.uvScaleMm, build, false);
  const curatedAo = loadTexture(textureUrls.aoMap, compiled.uvScaleMm, build, false);
  const map = curatedMap ?? pbr.maps.map;
  const maps = {
    ...(map ? { map } : {}),
    ...(curatedNormal ? { normalMap: curatedNormal } : {}),
    ...(curatedRoughness ? { roughnessMap: curatedRoughness } : {}),
    ...(curatedAo ? { aoMap: curatedAo } : {}),
    ...(!curatedMap && pbr.maps.bumpMap ? { bumpMap: pbr.maps.bumpMap } : {}),
  };
  return new MeshPhysicalMaterial({
    name: sourceName,
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

function buildImportedMaterial(
  textures: ModelTextureUrls,
  mode: RenderMode,
  build: GlbMaterialBuildContext,
) {
  const response = resolveImportedGlbMaterialResponse(mode, build);
  const map = loadTexture(textures.map, 1000, build, true);
  const normalMap = loadTexture(textures.normalMap, 1000, build, false);
  const roughnessMap = loadTexture(textures.roughnessMap, 1000, build, false);
  const metalnessMap = loadTexture(textures.metalnessMap, 1000, build, false);
  const maps = {
    ...(map ? { map } : {}),
    ...(normalMap ? { normalMap } : {}),
    ...(roughnessMap ? { roughnessMap } : {}),
    ...(metalnessMap ? { metalnessMap } : {}),
  };
  return new MeshPhysicalMaterial({
    color: new Color("white"),
    metalness: 0,
    ...response,
    ...maps,
  });
}

type ApplyGlbSlotArgs = {
  materialGroups: Record<string, string>;
  materialBindings: Record<string, string>;
  materials: Map<string, CompiledMaterial>;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  modelViewQuality?: RenderQuality | null;
  castShadow: boolean;
  receiveShadow: boolean;
  importedTextures?: ModelTextureUrls;
  slotPolicies?: Record<string, MaterialSlotPolicy>;
  /** Keep Kenney/GLB baked materials until a non-default finish is painted. */
  preserveSourceMaterials?: boolean;
};

export function applyGlbSlotMaterials(root: Object3D, args: ApplyGlbSlotArgs) {
  const build = resolveGlbMaterialBuildContext({
    renderQuality: args.renderQuality,
    modelViewQuality: args.modelViewQuality,
    mode: args.renderMode,
  });
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.castShadow = args.castShadow;
    child.receiveShadow = args.receiveShadow;
    const matList = asMeshMaterials(child.material);
    const materialName = matList.map((mat) => mat.name).find((name) => Boolean(name)) ?? "";
    const sourceName = readGlbSourceMaterialName(child.userData, materialName);
    persistGlbSourceMaterialName(child.userData, sourceName);
    // Keep source only when a color map is baked (Kenney solids still get catalog finishes).
    if (args.preserveSourceMaterials && matList.some((m) => Boolean((m as Material & { map?: Texture | null }).map))) {
      return;
    }
    const matchArgs = {
      materialName: sourceName,
      meshName: child.name,
      slotPolicies: args.slotPolicies,
      materialGroups: args.materialGroups,
    };
    const slot = matchSlotFromMaterialOrMeshName(matchArgs);
    const materialId = resolveMaterialIdForPrimitive({
      ...matchArgs,
      materialBindings: args.materialBindings,
    });
    if (!materialId && !args.importedTextures?.map) return;
    const compiled = materialId ? args.materials.get(materialId) : undefined;
    if (!compiled && !args.importedTextures?.map) return;
    const next = compiled
      ? buildPhysicalMaterial(compiled, args.renderMode, sourceName, slot ?? sourceName, build)
      : buildImportedMaterial(args.importedTextures!, args.renderMode, build);
    next.name = sourceName;
    persistGlbSourceMaterialName(next.userData, sourceName);
    for (const previous of matList) {
      disposeMaterialTextures(previous);
      previous.dispose();
    }
    child.material = next;
  });
}
