import type { LivingRoomCatalogItem } from "./catalog";
import { LIVING_ROOM_MATERIAL_IDS as M } from "./materials";

export const LIVING_ROOM_FURNITURE_ITEMS = [
  {
    id: "living:sofa-3-seat", name: "Three Seat Sofa",
    kind: "furniture", category: "sofa", placement: "floor",
    dimensions: { widthMm: 2200, heightMm: 820, depthMm: 920 },
    materialSlots: { upholstery: M.oatmealFabric, legs: M.charcoalMetal },
    parameters: { seats: 3, cushionStyle: "loose" },
  },
  {
    id: "living:lounge-chair", name: "Lounge Chair",
    kind: "furniture", category: "chair", placement: "floor",
    dimensions: { widthMm: 820, heightMm: 880, depthMm: 860 },
    materialSlots: { upholstery: M.oliveFabric, frame: M.naturalOak },
    parameters: { seats: 1 },
  },
  {
    id: "living:coffee-table", name: "Coffee Table",
    kind: "furniture", category: "table", placement: "floor",
    dimensions: { widthMm: 1200, heightMm: 380, depthMm: 650 },
    materialSlots: { top: M.naturalOak, frame: M.charcoalMetal },
    parameters: { topShape: "rounded-rectangle" },
  },
  {
    id: "living:side-table", name: "Side Table",
    kind: "furniture", category: "table", placement: "floor",
    dimensions: { widthMm: 480, heightMm: 520, depthMm: 480 },
    materialSlots: { top: M.naturalOak, frame: M.charcoalMetal },
    parameters: { topShape: "round" },
  },
  {
    id: "living:tv-unit", name: "Floating TV Console",
    kind: "furniture", category: "media-unit", placement: "floor",
    dimensions: { widthMm: 2000, heightMm: 520, depthMm: 440 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { doorCount: 3, cableOpening: true, floating: true, mountHeightMm: 360 },
  },
  {
    id: "living:sofa-sectional", name: "Modular Sectional",
    kind: "furniture", category: "sofa", placement: "floor",
    dimensions: { widthMm: 2950, heightMm: 800, depthMm: 1750 },
    materialSlots: { upholstery: M.oatmealFabric, legs: M.charcoalMetal },
    parameters: { seats: 4, cushionStyle: "modular", chaise: true },
  },
  {
    id: "living:sofa-loveseat", name: "Compact Loveseat",
    kind: "furniture", category: "sofa", placement: "floor",
    dimensions: { widthMm: 1650, heightMm: 790, depthMm: 860 },
    materialSlots: { upholstery: M.oliveFabric, legs: M.naturalOak },
    parameters: { seats: 2, cushionStyle: "tight" },
  },
  {
    id: "living:accent-chair", name: "Sculpted Accent Chair",
    kind: "furniture", category: "chair", placement: "floor",
    dimensions: { widthMm: 760, heightMm: 820, depthMm: 780 },
    materialSlots: { upholstery: M.oatmealFabric, frame: M.walnut },
    parameters: { seats: 1, silhouette: "sculpted" },
  },
  {
    id: "living:coffee-table-round", name: "Round Coffee Table",
    kind: "furniture", category: "table", placement: "floor",
    dimensions: { widthMm: 900, heightMm: 360, depthMm: 900 },
    materialSlots: { top: M.walnut, frame: M.charcoalMetal },
    parameters: { topShape: "round" },
  },
  {
    id: "living:console-table", name: "Slim Console Table",
    kind: "furniture", category: "table", placement: "floor",
    dimensions: { widthMm: 1500, heightMm: 780, depthMm: 360 },
    materialSlots: { top: M.naturalOak, frame: M.charcoalMetal },
    parameters: { topShape: "rectangle" },
  },
  {
    id: "living:bookcase", name: "Open Bookcase",
    kind: "furniture", category: "storage", placement: "floor",
    dimensions: { widthMm: 1100, heightMm: 2100, depthMm: 360 },
    materialSlots: { carcass: M.naturalOak },
    parameters: { shelfCount: 5 },
  },
  {
    id: "living:ottoman", name: "Upholstered Ottoman",
    kind: "furniture", category: "seat", placement: "floor",
    dimensions: { widthMm: 820, heightMm: 420, depthMm: 620 },
    materialSlots: { upholstery: M.oliveFabric, base: M.walnut },
    parameters: { silhouette: "soft-square" },
  },
] as const satisfies readonly LivingRoomCatalogItem[];
