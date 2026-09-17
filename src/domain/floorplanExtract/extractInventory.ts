import type { ExtractionResult } from "./types";

export type ExtractInventory = {
  rooms: number;
  walls: number;
  doors: number;
  windows: number;
  pixelScale: number | null;
  /** Heuristic: too thin to be a whole house plan like lounge-plan. */
  looksIncomplete: boolean;
};

export function inventoryExtraction(draft: ExtractionResult): ExtractInventory {
  const rooms = draft.polygons.rooms?.length ?? 0;
  const walls = draft.polygons.walls?.length ?? 0;
  const doors = draft.polygons.doors?.length ?? 0;
  const windows = draft.polygons.windows?.length ?? 0;
  const pixelScale = typeof draft.pixel_scale === "number" ? draft.pixel_scale : null;
  return {
    rooms,
    walls,
    doors,
    windows,
    pixelScale,
    looksIncomplete: walls < 4 && rooms <= 1,
  };
}

export function formatExtractInventory(inv: ExtractInventory): string {
  const scale = inv.pixelScale != null ? ` · scale ${inv.pixelScale}` : "";
  return `${inv.walls} walls · ${inv.rooms} rooms · ${inv.doors} doors · ${inv.windows} windows${scale}`;
}
