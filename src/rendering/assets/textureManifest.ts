import type { TextureAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/** Local texture slots. Files are optional; procedural maps fill gaps. */
export const TEXTURE_ASSET_MANIFEST = [
  { id: "tex:oak-color", name: "Natural Oak Color", kind: "color", assetKey: "textures/wood/oak-color.jpg", available: false },
  { id: "tex:oak-normal", name: "Natural Oak Normal", kind: "normal", assetKey: "textures/wood/oak-normal.jpg", available: false },
  { id: "tex:oak-rough", name: "Natural Oak Roughness", kind: "roughness", assetKey: "textures/wood/oak-rough.jpg", available: false },
  { id: "tex:walnut-color", name: "Walnut Color", kind: "color", assetKey: "textures/wood/walnut-color.jpg", available: false },
  { id: "tex:walnut-normal", name: "Walnut Normal", kind: "normal", assetKey: "textures/wood/walnut-normal.jpg", available: false },
  { id: "tex:fabric-oatmeal-color", name: "Oatmeal Fabric Color", kind: "color", assetKey: "textures/fabric/oatmeal-color.jpg", available: false },
  { id: "tex:fabric-olive-color", name: "Olive Fabric Color", kind: "color", assetKey: "textures/fabric/olive-color.jpg", available: false },
  { id: "tex:paint-wall-color", name: "Wall Paint Color", kind: "color", assetKey: "textures/paint/wall-color.jpg", available: false },
  { id: "tex:rug-wool-color", name: "Wool Rug Color", kind: "color", assetKey: "textures/fabric/rug-wool-color.jpg", available: false },
  { id: "tex:metal-ao", name: "Metal AO", kind: "ao", assetKey: "textures/metal/charcoal-ao.jpg", available: false },
] as const satisfies readonly TextureAssetDefinition[];
