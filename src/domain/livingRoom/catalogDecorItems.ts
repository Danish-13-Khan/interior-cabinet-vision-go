import type { LivingRoomCatalogItem } from "./catalog";
import { LIVING_ROOM_MATERIAL_IDS as M } from "./materials";

export const LIVING_ROOM_DECOR_ITEMS = [
  {
    id: "living:decor-vase", name: "Ceramic Display Vase",
    kind: "decor", category: "accessory", placement: "wall",
    dimensions: { widthMm: 180, heightMm: 320, depthMm: 180 },
    materialSlots: { surface: M.walnut },
    parameters: { style: "tapered" },
  },
  {
    id: "living:decor-sculpture", name: "Display Sculpture",
    kind: "decor", category: "accessory", placement: "wall",
    dimensions: { widthMm: 220, heightMm: 260, depthMm: 150 },
    materialSlots: { surface: M.naturalOak },
    parameters: { style: "rounded" },
  },
  {
    id: "living:ceiling-fan", name: "Contemporary Ceiling Fan",
    kind: "furniture", category: "ceiling-fixture", placement: "wall",
    dimensions: { widthMm: 1450, heightMm: 260, depthMm: 1450 },
    materialSlots: { metal: M.charcoalMetal, blades: M.walnut },
    parameters: { bladeCount: 4 },
  },
  {
    id: "living:curtain-set", name: "Full Height Curtain Set",
    kind: "decor", category: "window-treatment", placement: "wall",
    dimensions: { widthMm: 2200, heightMm: 2100, depthMm: 70 },
    materialSlots: { fabric: M.oatmealFabric, rail: M.charcoalMetal },
    parameters: { panelCount: 2, fullness: "soft" },
  },
  {
    id: "living:area-rug", name: "Area Rug",
    kind: "decor", category: "rug", placement: "floor",
    dimensions: { widthMm: 3000, heightMm: 18, depthMm: 2200 },
    materialSlots: { surface: M.woolRug },
    parameters: { pile: "low" },
  },
  {
    id: "living:wall-mirror", name: "Wall Mirror",
    kind: "decor", category: "mirror", placement: "wall",
    dimensions: { widthMm: 900, heightMm: 1400, depthMm: 35 },
    materialSlots: { mirror: M.clearGlass, frame: M.charcoalMetal },
    parameters: { mountHeightMm: 850 },
  },
  {
    id: "living:floor-lamp", name: "Floor Lamp",
    kind: "lighting", category: "floor-lamp", placement: "floor",
    dimensions: { widthMm: 420, heightMm: 1650, depthMm: 420 },
    materialSlots: { frame: M.charcoalMetal, shade: M.oatmealFabric },
    parameters: { bulbTemperatureK: 2700, lumens: 800 },
  },
  {
    id: "living:indoor-plant", name: "Indoor Plant",
    kind: "decor", category: "plant", placement: "floor",
    dimensions: { widthMm: 720, heightMm: 1450, depthMm: 720 },
    materialSlots: { foliage: M.oliveFabric, planter: M.woolRug },
    parameters: { foliageStyle: "broad-leaf" },
  },
  {
    id: "living:structural-column", name: "Structural Column",
    kind: "custom", category: "structural-column", placement: "floor",
    dimensions: { widthMm: 300, heightMm: 2800, depthMm: 300 },
    materialSlots: { finish: M.wallPaint },
    parameters: { profile: "square", structural: true },
  },
] as const satisfies readonly LivingRoomCatalogItem[];
