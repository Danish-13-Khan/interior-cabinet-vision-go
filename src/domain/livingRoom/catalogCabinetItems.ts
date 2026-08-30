import { CABINET_CATALOG_BINDINGS } from "../cabinetIdentity/catalogBindings";
import type { LivingRoomCatalogItem } from "./catalog";
import { LIVING_ROOM_MATERIAL_IDS as M } from "./materials";

const B = CABINET_CATALOG_BINDINGS;

export const LIVING_ROOM_CABINET_ITEMS = [
  {
    id: "living:wardrobe-wall", name: "Wardrobe Wall",
    kind: "cabinet", category: "wardrobe", placement: "wall",
    cabinetType: B["living:wardrobe-wall"].cabinetType,
    familyId: B["living:wardrobe-wall"].familyId,
    dimensions: { widthMm: 2400, heightMm: 2400, depthMm: 600 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { doorCount: 4, shelfCount: 5, wardrobe: true },
  },
  {
    id: "living:corner-wardrobe", name: "Corner Wardrobe",
    kind: "cabinet", category: "corner-wardrobe", placement: "wall",
    cabinetType: B["living:corner-wardrobe"].cabinetType,
    familyId: B["living:corner-wardrobe"].familyId,
    dimensions: { widthMm: 900, heightMm: 2200, depthMm: 600 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { doorCount: 1, shelfCount: 4, corner: true, legWidthMm: 900 },
  },
  {
    id: "living:tall-pantry-600", name: "Tall Pantry · 600",
    kind: "cabinet", category: "storage", placement: "wall",
    cabinetType: B["living:tall-pantry-600"].cabinetType,
    familyId: B["living:tall-pantry-600"].familyId,
    dimensions: { widthMm: 600, heightMm: 2400, depthMm: 600 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { sku: "MW-TALL-600", doorCount: 2, shelfCount: 5, pantry: true },
  },
  {
    id: "living:base-cabinet-900", name: "Base Cabinet · 900",
    kind: "cabinet", category: "storage", placement: "wall",
    cabinetType: B["living:base-cabinet-900"].cabinetType,
    familyId: B["living:base-cabinet-900"].familyId,
    dimensions: { widthMm: 900, heightMm: 900, depthMm: 600 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { sku: "MW-BASE-900", doorCount: 2, drawerCount: 1, baseCabinet: true },
  },
  {
    id: "living:wall-cabinet-900", name: "Wall Cabinet · 900",
    kind: "cabinet", category: "storage", placement: "wall",
    cabinetType: B["living:wall-cabinet-900"].cabinetType,
    familyId: B["living:wall-cabinet-900"].familyId,
    dimensions: { widthMm: 900, heightMm: 720, depthMm: 350 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { sku: "MW-WALL-900", doorCount: 2, wallCabinet: true },
  },
  {
    id: "living:drawer-cabinet-900", name: "Drawer Bank · 900",
    kind: "cabinet", category: "storage", placement: "wall",
    cabinetType: B["living:drawer-cabinet-900"].cabinetType,
    familyId: B["living:drawer-cabinet-900"].familyId,
    dimensions: { widthMm: 900, heightMm: 900, depthMm: 600 },
    materialSlots: { carcass: M.walnut, fronts: M.naturalOak },
    parameters: { sku: "MW-DRAWER-900", doorCount: 0, drawerCount: 3, drawerBank: true },
  },
  {
    id: "living:feature-wall-fluted", name: "Fluted Timber TV Feature Wall",
    kind: "cabinet", category: "feature-wall", placement: "wall",
    dimensions: { widthMm: 3600, heightMm: 2200, depthMm: 62 },
    materialSlots: { backing: M.walnut, slats: M.naturalOak, trim: M.walnut },
    parameters: { slatWidthMm: 46, slatGapMm: 18, edgeRailMm: 56 },
  },
  {
    id: "living:display-niche", name: "Lit Display Niche",
    kind: "cabinet", category: "display-niche", placement: "wall",
    dimensions: { widthMm: 560, heightMm: 1900, depthMm: 280 },
    materialSlots: { carcass: M.walnut, back: M.charcoalMetal, shelves: M.naturalOak },
    parameters: { shelfCount: 4, integratedLight: true },
  },
] as const satisfies readonly LivingRoomCatalogItem[];
