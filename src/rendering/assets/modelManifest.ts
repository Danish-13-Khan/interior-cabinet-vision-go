import type { ModelAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/**
 * Placeholder GLB spine for soft goods. `available: false` forces procedural fallback.
 * assetKey is registry metadata only — never written into InteriorProject JSON.
 */
export const MODEL_ASSET_MANIFEST = [
  { id: "model:sofa-3-seat", name: "Three Seat Sofa", catalogItemId: "living:sofa-3-seat", assetKey: "models/soft-goods/sofa-3-seat.glb", available: false, defaultUvScaleMm: 900 },
  { id: "model:sofa-sectional", name: "Modular Sectional", catalogItemId: "living:sofa-sectional", assetKey: "models/soft-goods/sofa-sectional.glb", available: false, defaultUvScaleMm: 900 },
  { id: "model:sofa-loveseat", name: "Compact Loveseat", catalogItemId: "living:sofa-loveseat", assetKey: "models/soft-goods/sofa-loveseat.glb", available: false, defaultUvScaleMm: 900 },
  { id: "model:lounge-chair", name: "Lounge Chair", catalogItemId: "living:lounge-chair", assetKey: "models/soft-goods/lounge-chair.glb", available: false, defaultUvScaleMm: 700 },
  { id: "model:accent-chair", name: "Accent Chair", catalogItemId: "living:accent-chair", assetKey: "models/soft-goods/accent-chair.glb", available: false, defaultUvScaleMm: 700 },
  { id: "model:coffee-table", name: "Coffee Table", catalogItemId: "living:coffee-table", assetKey: "models/soft-goods/coffee-table.glb", available: false, defaultUvScaleMm: 800 },
  { id: "model:coffee-table-round", name: "Round Coffee Table", catalogItemId: "living:coffee-table-round", assetKey: "models/soft-goods/coffee-table-round.glb", available: false, defaultUvScaleMm: 800 },
  { id: "model:side-table", name: "Side Table", catalogItemId: "living:side-table", assetKey: "models/soft-goods/side-table.glb", available: false, defaultUvScaleMm: 600 },
  { id: "model:console-table", name: "Console Table", catalogItemId: "living:console-table", assetKey: "models/soft-goods/console-table.glb", available: false, defaultUvScaleMm: 800 },
  { id: "model:ottoman", name: "Ottoman", catalogItemId: "living:ottoman", assetKey: "models/soft-goods/ottoman.glb", available: false, defaultUvScaleMm: 500 },
  { id: "model:floor-lamp", name: "Floor Lamp", catalogItemId: "living:floor-lamp", assetKey: "models/soft-goods/floor-lamp.glb", available: false, defaultUvScaleMm: 500 },
  { id: "model:indoor-plant", name: "Indoor Plant", catalogItemId: "living:indoor-plant", assetKey: "models/soft-goods/indoor-plant.glb", available: false, defaultUvScaleMm: 600 },
] as const satisfies readonly ModelAssetDefinition[];
