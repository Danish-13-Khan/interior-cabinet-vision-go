import type { RoomType } from "../../domain/interiorProject";

/** Short label shown beside room tabs in the switcher. */
export function roomTypeIcon(roomType: RoomType | undefined): string {
  switch (roomType) {
    case "kitchen": return "🍳";
    case "bedroom": return "🛏";
    case "bathroom": return "🚿";
    case "living-room": return "🛋";
    case "office": return "🖥";
    case "utility": return "🧺";
    default: return "▢";
  }
}
