import type { LivingRoomCatalogId } from "./catalog";

export type LivingRoomStarterObject = {
  key: string;
  catalogItemId: LivingRoomCatalogId;
  position: { x: number; y: number; z: number };
  rotationY?: number;
};

/** Scene-specific composition data; reusable primitives stay in their adapters. */
export const LIVING_ROOM_STARTER_LAYOUT: readonly LivingRoomStarterObject[] = [
  { key: "tv-feature-wall", catalogItemId: "living:feature-wall-fluted", position: { x: 0, y: 0, z: -2140 } },
  { key: "tv-display-niche", catalogItemId: "living:display-niche", position: { x: 1350, y: 280, z: -2020 } },
  { key: "display-vase", catalogItemId: "living:decor-vase", position: { x: 1350, y: 730, z: -1845 } },
  { key: "display-sculpture", catalogItemId: "living:decor-sculpture", position: { x: 1350, y: 1270, z: -1845 } },
  { key: "sofa", catalogItemId: "living:sofa-3-seat", position: { x: 0, y: 0, z: 1150 } },
  { key: "lounge-chair", catalogItemId: "living:lounge-chair", position: { x: -2100, y: 0, z: 300 }, rotationY: 45 },
  { key: "coffee-table", catalogItemId: "living:coffee-table", position: { x: 0, y: 0, z: -50 } },
  { key: "side-table", catalogItemId: "living:side-table", position: { x: -2100, y: 0, z: -1050 } },
  { key: "tv-unit", catalogItemId: "living:tv-unit", position: { x: 0, y: 0, z: -1700 } },
  { key: "area-rug", catalogItemId: "living:area-rug", position: { x: 0, y: 0, z: 300 } },
  { key: "wall-mirror", catalogItemId: "living:wall-mirror", position: { x: 3020, y: 850, z: -650 }, rotationY: 270 },
  { key: "floor-lamp", catalogItemId: "living:floor-lamp", position: { x: 2350, y: 0, z: -1150 } },
];
