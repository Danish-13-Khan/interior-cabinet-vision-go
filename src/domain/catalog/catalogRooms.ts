import type { CatalogItem } from "./types";

export const CATALOG_ROOM_TYPES = [
  { id: "living-room", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "dining", label: "Dining" },
  { id: "bathroom", label: "Bathroom" },
  { id: "office", label: "Home office" },
  { id: "utility", label: "Utility" },
] as const;

export type CatalogRoomType = (typeof CATALOG_ROOM_TYPES)[number]["id"];

const ALL_ROOMS = CATALOG_ROOM_TYPES.map((room) => room.id) as CatalogRoomType[];

/** Items that belong anywhere; filtering them out would empty every room view. */
const UNIVERSAL_CATEGORIES = new Set(["architecture", "decor", "lighting"]);

const BY_CATEGORY: Record<string, CatalogRoomType[]> = {
  bathroom: ["bathroom"],
  "beds-and-bedroom": ["bedroom"],
  "kitchen-and-appliances": ["kitchen"],
  utility: ["utility"],
  electronics: ["living-room", "office", "bedroom"],
  storage: ["living-room", "bedroom", "office"],
  seating: ["living-room", "dining", "office"],
  "tables-and-desks": ["living-room", "dining", "office"],
};

/** Keys are the subcategories that actually exist in the built-in manifest. */
const BY_SUBCATEGORY: Record<string, CatalogRoomType[]> = {
  beds: ["bedroom"],
  bedding: ["bedroom"],
  bedroom: ["bedroom"],
  nightstands: ["bedroom"],
  sofas: ["living-room"],
  media: ["living-room"],
  rugs: ["living-room", "bedroom"],
  bookcases: ["living-room", "bedroom", "office"],
  storage: ["living-room", "bedroom", "office"],
  desks: ["office", "bedroom"],
  chairs: ["dining", "office", "living-room"],
  tables: ["living-room", "dining"],
  seating: ["living-room", "dining", "office"],
  "cabinet-props": ["kitchen"],
  appliances: ["kitchen"],
  "small-appliances": ["kitchen"],
  fixtures: ["bathroom"],
  laundry: ["utility"],
  devices: ["living-room", "office", "bedroom"],
};

function explicitRooms(item: CatalogItem): CatalogRoomType[] {
  const declared = item.rooms ?? [];
  const tagged = item.tags
    .filter((tag) => tag.startsWith("room:"))
    .map((tag) => tag.slice("room:".length));
  const combined = [...declared, ...tagged]
    .filter((room): room is CatalogRoomType => ALL_ROOMS.includes(room as CatalogRoomType));
  return [...new Set(combined)];
}

/**
 * Rooms an item is useful in. An explicit `rooms` field or a `room:*` tag wins;
 * otherwise it is derived from catalogue category and subcategory so the existing
 * 140 items filter correctly without re-authoring the manifest.
 */
export function roomsForCatalogItem(item: CatalogItem): CatalogRoomType[] {
  const explicit = explicitRooms(item);
  if (explicit.length > 0) return explicit;
  if (UNIVERSAL_CATEGORIES.has(item.category)) return [...ALL_ROOMS];
  const bySub = BY_SUBCATEGORY[item.subcategory];
  if (bySub) return [...bySub];
  const byCategory = BY_CATEGORY[item.category];
  if (byCategory) return [...byCategory];
  return [...ALL_ROOMS];
}

export function catalogItemServesRoom(item: CatalogItem, room: string): boolean {
  if (!room || room === "all") return true;
  return roomsForCatalogItem(item).includes(room as CatalogRoomType);
}

export function catalogRoomLabel(room: string): string {
  return CATALOG_ROOM_TYPES.find((entry) => entry.id === room)?.label ?? room;
}
