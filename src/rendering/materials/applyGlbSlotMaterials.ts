import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  type Material,
  type Object3D,
} from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";
import { resolveMaterialIdForMeshName } from "../../domain/livingRoom/glbMaterialGroups";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { createPbrMaterialDescriptor } from "../materials/createPbrMaterial";

function asMeshMaterials(material: Material | Material[]) {
  return Array.isArray(material) ? material : [material];
}

function buildPhysicalMaterial(
  compiled: CompiledMaterial,
  mode: RenderMode,
  primitiveHint: string,
) {
  const pbr = createPbrMaterialDescriptor(compiled, mode, {
    primitiveId: primitiveHint,
  });
  return new MeshPhysicalMaterial({
    color: new Color(pbr.color),
    map: pbr.maps.map,
    bumpMap: pbr.maps.bumpMap,
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
      previous.dispose();
    }
    child.material = next;
  });
}
