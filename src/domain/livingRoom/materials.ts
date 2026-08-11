import type { MaterialEntity } from "../interiorProject";

export const LIVING_ROOM_MATERIAL_IDS = {
  wallPaint: "lr-material-wall-warm-white",
  ceilingPaint: "lr-material-ceiling-soft-white",
  naturalOak: "lr-material-natural-oak",
  walnut: "lr-material-walnut",
  oatmealFabric: "lr-material-fabric-oatmeal",
  oliveFabric: "lr-material-fabric-olive",
  charcoalMetal: "lr-material-metal-charcoal",
  clearGlass: "lr-material-glass-clear",
  woolRug: "lr-material-rug-wool-sand",
} as const;

const LIVING_ROOM_MATERIAL_PRESETS: readonly MaterialEntity[] = [
  {
    id: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    name: "Warm White Wall Paint",
    kind: "paint",
    color: "#e9e3d8",
    roughness: 0.86,
    metalness: 0,
    opacity: 1,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
    name: "Soft White Ceiling Paint",
    kind: "paint",
    color: "#f5f2eb",
    roughness: 0.9,
    metalness: 0,
    opacity: 1,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    name: "Natural Oak",
    kind: "wood",
    color: "#b98a58",
    roughness: 0.62,
    metalness: 0,
    opacity: 1,
    extensions: { grainDirection: "length" },
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.walnut,
    name: "Smoked Walnut",
    kind: "wood",
    color: "#5a3928",
    roughness: 0.56,
    metalness: 0,
    opacity: 1,
    extensions: { grainDirection: "length" },
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    name: "Oatmeal Weave",
    kind: "fabric",
    color: "#c8baa6",
    roughness: 0.96,
    metalness: 0,
    opacity: 1,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.oliveFabric,
    name: "Olive Weave",
    kind: "fabric",
    color: "#73765a",
    roughness: 0.95,
    metalness: 0,
    opacity: 1,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    name: "Charcoal Powder Coat",
    kind: "metal",
    color: "#2d302f",
    roughness: 0.36,
    metalness: 0.72,
    opacity: 1,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.clearGlass,
    name: "Clear Glass",
    kind: "glass",
    color: "#d8e4e2",
    roughness: 0.08,
    metalness: 0,
    opacity: 0.32,
  },
  {
    id: LIVING_ROOM_MATERIAL_IDS.woolRug,
    name: "Sand Wool Rug",
    kind: "fabric",
    color: "#b8a68d",
    roughness: 1,
    metalness: 0,
    opacity: 1,
  },
];

export function createLivingRoomMaterials(): MaterialEntity[] {
  return LIVING_ROOM_MATERIAL_PRESETS.map((material) => ({
    ...material,
    extensions: material.extensions ? { ...material.extensions } : undefined,
  }));
}
