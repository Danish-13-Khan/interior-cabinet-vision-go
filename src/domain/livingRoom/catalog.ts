import type {
  InteriorObjectEntity,
  InteriorObjectKind,
  ParameterValue,
  Point3Mm,
  Size3Mm,
} from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

export type LivingRoomCatalogItem = {
  id: string;
  name: string;
  kind: InteriorObjectKind;
  category: string;
  dimensions: Size3Mm;
  materialSlots: Record<string, string>;
  parameters: Record<string, ParameterValue>;
  placement: "floor" | "wall";
};

export type LivingRoomObjectPlacement = {
  id: string;
  roomId: string;
  position: Point3Mm;
  rotationY?: number;
};

export const LIVING_ROOM_CATALOG = [
  {
    id: "living:sofa-3-seat",
    name: "Three Seat Sofa",
    kind: "furniture",
    category: "sofa",
    dimensions: { widthMm: 2200, heightMm: 820, depthMm: 920 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
      legs: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { seats: 3, cushionStyle: "loose" },
    placement: "floor",
  },
  {
    id: "living:lounge-chair",
    name: "Lounge Chair",
    kind: "furniture",
    category: "chair",
    dimensions: { widthMm: 820, heightMm: 880, depthMm: 860 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
      frame: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    },
    parameters: { seats: 1 },
    placement: "floor",
  },
  {
    id: "living:coffee-table",
    name: "Coffee Table",
    kind: "furniture",
    category: "table",
    dimensions: { widthMm: 1200, heightMm: 380, depthMm: 650 },
    materialSlots: {
      top: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { topShape: "rounded-rectangle" },
    placement: "floor",
  },
  {
    id: "living:side-table",
    name: "Side Table",
    kind: "furniture",
    category: "table",
    dimensions: { widthMm: 480, heightMm: 520, depthMm: 480 },
    materialSlots: {
      top: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { topShape: "round" },
    placement: "floor",
  },
  {
    id: "living:tv-unit",
    name: "Floating TV Console",
    kind: "furniture",
    category: "media-unit",
    dimensions: { widthMm: 2000, heightMm: 520, depthMm: 440 },
    materialSlots: {
      carcass: LIVING_ROOM_MATERIAL_IDS.walnut,
      fronts: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    },
    parameters: { doorCount: 3, cableOpening: true, floating: true, mountHeightMm: 360 },
    placement: "floor",
  },
  {
    id: "living:feature-wall-fluted",
    name: "Fluted Timber TV Feature Wall",
    kind: "cabinet",
    category: "feature-wall",
    dimensions: { widthMm: 3400, heightMm: 2300, depthMm: 58 },
    materialSlots: {
      backing: LIVING_ROOM_MATERIAL_IDS.walnut,
      slats: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      trim: LIVING_ROOM_MATERIAL_IDS.walnut,
    },
    parameters: { slatWidthMm: 38, slatGapMm: 14, edgeRailMm: 48 },
    placement: "wall",
  },
  {
    id: "living:display-niche",
    name: "Lit Display Niche",
    kind: "cabinet",
    category: "display-niche",
    dimensions: { widthMm: 560, heightMm: 1900, depthMm: 280 },
    materialSlots: {
      carcass: LIVING_ROOM_MATERIAL_IDS.walnut,
      back: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
      shelves: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    },
    parameters: { shelfCount: 4, integratedLight: true },
    placement: "wall",
  },
  {
    id: "living:decor-vase",
    name: "Ceramic Display Vase",
    kind: "decor",
    category: "accessory",
    dimensions: { widthMm: 180, heightMm: 320, depthMm: 180 },
    materialSlots: { surface: LIVING_ROOM_MATERIAL_IDS.walnut },
    parameters: { style: "tapered" },
    placement: "wall",
  },
  {
    id: "living:decor-sculpture",
    name: "Display Sculpture",
    kind: "decor",
    category: "accessory",
    dimensions: { widthMm: 220, heightMm: 260, depthMm: 150 },
    materialSlots: { surface: LIVING_ROOM_MATERIAL_IDS.naturalOak },
    parameters: { style: "rounded" },
    placement: "wall",
  },
  {
    id: "living:ceiling-fan",
    name: "Contemporary Ceiling Fan",
    kind: "furniture",
    category: "ceiling-fixture",
    dimensions: { widthMm: 1450, heightMm: 260, depthMm: 1450 },
    materialSlots: {
      metal: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
      blades: LIVING_ROOM_MATERIAL_IDS.walnut,
    },
    parameters: { bladeCount: 4 },
    placement: "wall",
  },
  {
    id: "living:curtain-set",
    name: "Full Height Curtain Set",
    kind: "decor",
    category: "window-treatment",
    dimensions: { widthMm: 2200, heightMm: 2100, depthMm: 70 },
    materialSlots: {
      fabric: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
      rail: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { panelCount: 2, fullness: "soft" },
    placement: "wall",
  },
  {
    id: "living:area-rug",
    name: "Area Rug",
    kind: "decor",
    category: "rug",
    dimensions: { widthMm: 3000, heightMm: 18, depthMm: 2200 },
    materialSlots: { surface: LIVING_ROOM_MATERIAL_IDS.woolRug },
    parameters: { pile: "low" },
    placement: "floor",
  },
  {
    id: "living:wall-mirror",
    name: "Wall Mirror",
    kind: "decor",
    category: "mirror",
    dimensions: { widthMm: 900, heightMm: 1400, depthMm: 35 },
    materialSlots: {
      mirror: LIVING_ROOM_MATERIAL_IDS.clearGlass,
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { mountHeightMm: 850 },
    placement: "wall",
  },
  {
    id: "living:floor-lamp",
    name: "Floor Lamp",
    kind: "lighting",
    category: "floor-lamp",
    dimensions: { widthMm: 420, heightMm: 1650, depthMm: 420 },
    materialSlots: {
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
      shade: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    },
    parameters: { bulbTemperatureK: 2700, lumens: 800 },
    placement: "floor",
  },
  {
    id: "living:sofa-sectional",
    name: "Modular Sectional",
    kind: "furniture",
    category: "sofa",
    dimensions: { widthMm: 2950, heightMm: 800, depthMm: 1750 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
      legs: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { seats: 4, cushionStyle: "modular", chaise: true },
    placement: "floor",
  },
  {
    id: "living:sofa-loveseat",
    name: "Compact Loveseat",
    kind: "furniture",
    category: "sofa",
    dimensions: { widthMm: 1650, heightMm: 790, depthMm: 860 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
      legs: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    },
    parameters: { seats: 2, cushionStyle: "tight" },
    placement: "floor",
  },
  {
    id: "living:accent-chair",
    name: "Sculpted Accent Chair",
    kind: "furniture",
    category: "chair",
    dimensions: { widthMm: 760, heightMm: 820, depthMm: 780 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
      frame: LIVING_ROOM_MATERIAL_IDS.walnut,
    },
    parameters: { seats: 1, silhouette: "sculpted" },
    placement: "floor",
  },
  {
    id: "living:coffee-table-round",
    name: "Round Coffee Table",
    kind: "furniture",
    category: "table",
    dimensions: { widthMm: 900, heightMm: 360, depthMm: 900 },
    materialSlots: {
      top: LIVING_ROOM_MATERIAL_IDS.walnut,
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { topShape: "round" },
    placement: "floor",
  },
  {
    id: "living:console-table",
    name: "Slim Console Table",
    kind: "furniture",
    category: "table",
    dimensions: { widthMm: 1500, heightMm: 780, depthMm: 360 },
    materialSlots: {
      top: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    },
    parameters: { topShape: "rectangle" },
    placement: "floor",
  },
  {
    id: "living:bookcase",
    name: "Open Bookcase",
    kind: "furniture",
    category: "storage",
    dimensions: { widthMm: 1100, heightMm: 2100, depthMm: 360 },
    materialSlots: { carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak },
    parameters: { shelfCount: 5 },
    placement: "floor",
  },
  {
    id: "living:ottoman",
    name: "Upholstered Ottoman",
    kind: "furniture",
    category: "seat",
    dimensions: { widthMm: 820, heightMm: 420, depthMm: 620 },
    materialSlots: {
      upholstery: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
      base: LIVING_ROOM_MATERIAL_IDS.walnut,
    },
    parameters: { silhouette: "soft-square" },
    placement: "floor",
  },
  {
    id: "living:indoor-plant",
    name: "Indoor Plant",
    kind: "decor",
    category: "plant",
    dimensions: { widthMm: 720, heightMm: 1450, depthMm: 720 },
    materialSlots: {
      foliage: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
      planter: LIVING_ROOM_MATERIAL_IDS.woolRug,
    },
    parameters: { foliageStyle: "broad-leaf" },
    placement: "floor",
  },
] as const satisfies readonly LivingRoomCatalogItem[];

export type LivingRoomCatalogId = (typeof LIVING_ROOM_CATALOG)[number]["id"];

export function getLivingRoomCatalogItem(id: LivingRoomCatalogId) {
  const item = LIVING_ROOM_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown living-room catalog item: ${id}`);
  return item;
}

export function createLivingRoomObject(
  catalogItemId: LivingRoomCatalogId,
  placement: LivingRoomObjectPlacement,
): InteriorObjectEntity {
  const item = getLivingRoomCatalogItem(catalogItemId);
  return {
    id: placement.id,
    roomId: placement.roomId,
    kind: item.kind,
    category: item.category,
    catalogItemId: item.id,
    name: item.name,
    position: { ...placement.position },
    rotation: { x: 0, y: placement.rotationY ?? 0, z: 0 },
    dimensions: { ...item.dimensions },
    materialSlots: { ...item.materialSlots },
    parameters: { ...item.parameters },
    extensions: { placement: item.placement },
  };
}
