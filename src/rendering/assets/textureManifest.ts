import type { TextureAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/** Local curated PBR textures under /public/textures. */
export const TEXTURE_ASSET_MANIFEST = [
  { id: "tex:oak-color", name: "Natural Oak Color", kind: "color", assetKey: "textures/wood/oak-color.png", available: true },
  { id: "tex:oak-normal", name: "Natural Oak Normal", kind: "normal", assetKey: "textures/wood/oak-normal.png", available: true },
  { id: "tex:oak-rough", name: "Natural Oak Roughness", kind: "roughness", assetKey: "textures/wood/oak-rough.png", available: true },
  { id: "tex:walnut-color", name: "Walnut Color", kind: "color", assetKey: "textures/wood/walnut-color.png", available: true },
  { id: "tex:walnut-normal", name: "Walnut Normal", kind: "normal", assetKey: "textures/wood/walnut-normal.png", available: true },
  { id: "tex:walnut-rough", name: "Walnut Roughness", kind: "roughness", assetKey: "textures/wood/walnut-rough.png", available: true },
  { id: "tex:fabric-oatmeal-color", name: "Oatmeal Fabric Color", kind: "color", assetKey: "textures/fabric/oatmeal-color.png", available: true },
  { id: "tex:fabric-oatmeal-normal", name: "Oatmeal Fabric Normal", kind: "normal", assetKey: "textures/fabric/oatmeal-normal.png", available: true },
  { id: "tex:fabric-oatmeal-rough", name: "Oatmeal Fabric Roughness", kind: "roughness", assetKey: "textures/fabric/oatmeal-rough.png", available: true },
  { id: "tex:fabric-olive-color", name: "Olive Fabric Color", kind: "color", assetKey: "textures/fabric/olive-color.png", available: true },
  { id: "tex:fabric-olive-normal", name: "Olive Fabric Normal", kind: "normal", assetKey: "textures/fabric/olive-normal.png", available: true },
  { id: "tex:fabric-olive-rough", name: "Olive Fabric Roughness", kind: "roughness", assetKey: "textures/fabric/olive-rough.png", available: true },
  { id: "tex:paint-wall-color", name: "Wall Paint Color", kind: "color", assetKey: "textures/paint/wall-color.png", available: true },
  { id: "tex:paint-wall-normal", name: "Wall Paint Normal", kind: "normal", assetKey: "textures/paint/wall-normal.png", available: true },
  { id: "tex:paint-wall-rough", name: "Wall Paint Roughness", kind: "roughness", assetKey: "textures/paint/wall-rough.png", available: true },
  { id: "tex:rug-wool-color", name: "Wool Rug Color", kind: "color", assetKey: "textures/fabric/rug-wool-color.png", available: true },
  { id: "tex:rug-wool-normal", name: "Wool Rug Normal", kind: "normal", assetKey: "textures/fabric/rug-wool-normal.png", available: true },
  { id: "tex:rug-wool-rough", name: "Wool Rug Roughness", kind: "roughness", assetKey: "textures/fabric/rug-wool-rough.png", available: true },
  { id: "tex:stone-warm-color", name: "Warm Stone Color", kind: "color", assetKey: "textures/stone/warm-color.png", available: true },
  { id: "tex:stone-warm-normal", name: "Warm Stone Normal", kind: "normal", assetKey: "textures/stone/warm-normal.png", available: true },
  { id: "tex:stone-warm-rough", name: "Warm Stone Roughness", kind: "roughness", assetKey: "textures/stone/warm-rough.png", available: true },
  { id: "tex:metal-ao", name: "Metal AO", kind: "ao", assetKey: "textures/metal/charcoal-ao.png", available: true },
] as const satisfies readonly TextureAssetDefinition[];
