import { LIVING_ROOM_CABINET_ITEMS } from "./catalogCabinetItems";

const BEDROOM = new Set(["living:wardrobe-wall", "living:corner-wardrobe", "living:tall-pantry-600"]);
const KITCHEN = new Set([
  "living:base-cabinet-900",
  "living:wall-cabinet-900",
  "living:drawer-cabinet-900",
  "living:tall-pantry-600",
  "living:open-shelf-900",
]);

/** Parametric millwork the furniture browser should offer alongside Kenney props. */
export function millworkShortcutsForRoom(room: string) {
  return LIVING_ROOM_CABINET_ITEMS.filter((item) => {
    if (room === "bedroom") return BEDROOM.has(item.id);
    if (room === "kitchen") return KITCHEN.has(item.id);
    if (room === "all") return BEDROOM.has(item.id) || KITCHEN.has(item.id);
    return false;
  });
}

export function millworkAssetCategories(categories: readonly string[]) {
  const preferred = ["wardrobe", "corner-wardrobe", "storage"];
  const unique = [...new Set(categories.filter((category) => category !== "all"))];
  return [
    "all",
    ...preferred.filter((category) => unique.includes(category)),
    ...unique.filter((category) => !preferred.includes(category)),
  ];
}
