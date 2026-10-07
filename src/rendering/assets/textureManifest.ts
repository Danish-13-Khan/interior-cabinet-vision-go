import type { TextureAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";
import { SCANNED_TEXTURE_URLS } from "./materialSetSources";

const SCANNED_TEXTURE_NAMES: Record<string, { name: string; kind: TextureAssetDefinition["kind"] }> = {
  "tex:oak-color": { name: "Natural Oak Color", kind: "color" },
  "tex:oak-normal": { name: "Natural Oak Normal", kind: "normal" },
  "tex:oak-rough": { name: "Natural Oak Roughness", kind: "roughness" },
  "tex:walnut-color": { name: "Walnut Color", kind: "color" },
  "tex:walnut-normal": { name: "Walnut Normal", kind: "normal" },
  "tex:walnut-rough": { name: "Walnut Roughness", kind: "roughness" },
  "tex:fabric-oatmeal-color": { name: "Oatmeal Fabric Color", kind: "color" },
  "tex:fabric-oatmeal-normal": { name: "Oatmeal Fabric Normal", kind: "normal" },
  "tex:fabric-oatmeal-rough": { name: "Oatmeal Fabric Roughness", kind: "roughness" },
  "tex:fabric-olive-color": { name: "Olive Fabric Color", kind: "color" },
  "tex:fabric-olive-normal": { name: "Olive Fabric Normal", kind: "normal" },
  "tex:fabric-olive-rough": { name: "Olive Fabric Roughness", kind: "roughness" },
  "tex:paint-wall-color": { name: "Wall Paint Color", kind: "color" },
  "tex:paint-wall-normal": { name: "Wall Paint Normal", kind: "normal" },
  "tex:paint-wall-rough": { name: "Wall Paint Roughness", kind: "roughness" },
  "tex:stone-warm-color": { name: "Warm Stone Color", kind: "color" },
  "tex:stone-warm-normal": { name: "Warm Stone Normal", kind: "normal" },
  "tex:stone-warm-rough": { name: "Warm Stone Roughness", kind: "roughness" },
  "tex:laminate-white-color": { name: "White Laminate Color", kind: "color" },
  "tex:laminate-white-normal": { name: "White Laminate Normal", kind: "normal" },
  "tex:laminate-white-rough": { name: "White Laminate Roughness", kind: "roughness" },
  "tex:laminate-grey-color": { name: "Grey Laminate Color", kind: "color" },
  "tex:laminate-grey-normal": { name: "Grey Laminate Normal", kind: "normal" },
  "tex:laminate-grey-rough": { name: "Grey Laminate Roughness", kind: "roughness" },
};

/** Local curated PBR textures. Scans are KTX2; metal AO stays PNG. */
export const TEXTURE_ASSET_MANIFEST = [
  ...Object.entries(SCANNED_TEXTURE_URLS).map(([id, url]) => ({
    id,
    name: SCANNED_TEXTURE_NAMES[id]!.name,
    kind: SCANNED_TEXTURE_NAMES[id]!.kind,
    assetKey: url.slice(1),
    available: true as const,
  })),
  { id: "tex:metal-ao", name: "Metal AO", kind: "ao" as const, assetKey: "textures/metal/charcoal-ao.png", available: true as const },
] satisfies readonly TextureAssetDefinition[];
