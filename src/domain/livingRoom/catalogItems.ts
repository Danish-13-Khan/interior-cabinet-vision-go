import { LIVING_ROOM_CABINET_ITEMS } from "./catalogCabinetItems";
import { LIVING_ROOM_DECOR_ITEMS } from "./catalogDecorItems";
import { LIVING_ROOM_FURNITURE_ITEMS } from "./catalogFurnitureItems";
import type { LivingRoomCatalogItem } from "./catalog";

export const LIVING_ROOM_CATALOG_ITEMS = [
  ...LIVING_ROOM_FURNITURE_ITEMS,
  ...LIVING_ROOM_CABINET_ITEMS,
  ...LIVING_ROOM_DECOR_ITEMS,
] as const satisfies readonly LivingRoomCatalogItem[];
