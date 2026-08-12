import type { TextureAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/** Local curated PBR textures under /public/textures. */
export const TEXTURE_ASSET_MANIFEST = [
  { id: "tex:oak-color", name: "Natural Oak Color", kind: "color", assetKey: "textures/wood/oak-color.png", available: true },
  { id: "tex:oak-normal", name: "Natural Oak Normal", kind: "normal", assetKey: "textures/wood/oak-normal.png", available: true },
  { id: "tex:oak-rough", name: "Natural Oak Roughness", kind: "roughness", assetKey: "textures/wood/oak-rough.png", available: true },
  { id: "tex:walnut-color", name: "Walnut Color", kind: "color", assetKey: "textures/wood/walnut-color.png", available: true },
  { id: "tex:walnut-normal", name: "Walnut Normal", kind: "normal", assetKey: "textures/wood/walnut-normal.png", available: true },
  { id: "tex:fabric-oatmeal-color", name: "Oatmeal Fabric Color", kind: "color", assetKey: "textures/fabric/oatmeal-color.png", available: true },
  { id: "tex:fabric-olive-color", name: "Olive Fabric Color", kind: "color", assetKey: "textures/fabric/olive-color.png", available: true },
  { id: "tex:paint-wall-color", name: "Wall Paint Color", kind: "color", assetKey: "textures/paint/wall-color.png", available: true },
  { id: "tex:rug-wool-color", name: "Wool Rug Color", kind: "color", assetKey: "textures/fabric/rug-wool-color.png", available: true },
  { id: "tex:metal-ao", name: "Metal AO", kind: "ao", assetKey: "textures/metal/charcoal-ao.png", available: true },
] as const satisfies readonly TextureAssetDefinition[];
