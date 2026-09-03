import type { CatalogPlacement } from "../types";

/** Kenney stems excluded in favor of parametric architecture. */
export const KENNEY_ARCHITECTURE_STEMS = [
  "doorway",
  "doorwayFront",
  "doorwayOpen",
  "floorCorner",
  "floorCornerRound",
  "floorFull",
  "floorHalf",
  "paneling",
  "stairs",
  "stairsCorner",
  "stairsOpen",
  "stairsOpenSingle",
  "wall",
  "wallCorner",
  "wallCornerRond",
  "wallDoorway",
  "wallDoorwayWide",
  "wallHalf",
  "wallWindow",
  "wallWindowSlide",
] as const;

export type KenneyClassification = {
  category: string;
  subcategory: string;
  placement: CatalogPlacement;
  tags: string[];
};

export function isArchitectureStem(stem: string): boolean {
  return (KENNEY_ARCHITECTURE_STEMS as readonly string[]).includes(stem);
}

/** Heuristic product grouping from Kenney filename stem. */
export function classifyKenneyStem(stem: string): KenneyClassification {
  if (isArchitectureStem(stem)) {
    return { category: "architecture", subcategory: "shell", placement: "floor", tags: ["excluded"] };
  }
  if (/^bathroom|^toilet|^shower|^bathtub/i.test(stem)) {
    return { category: "bathroom", subcategory: "fixtures", placement: "floor", tags: ["bathroom"] };
  }
  if (/^bed|^pillow|^cabinetBed/i.test(stem)) {
    return { category: "beds-and-bedroom", subcategory: "bedroom", placement: "floor", tags: ["bedroom"] };
  }
  if (/^lounge|^chair|^bench|^stool/i.test(stem)) {
    return { category: "seating", subcategory: "seating", placement: "floor", tags: ["seating"] };
  }
  if (/^table|^desk|^sideTable/i.test(stem)) {
    return { category: "tables-and-desks", subcategory: "tables", placement: "floor", tags: ["table"] };
  }
  if (/^bookcase|^cabinetTelevision|^books$/i.test(stem)) {
    return { category: "storage", subcategory: "storage", placement: "floor", tags: ["storage"] };
  }
  if (/^kitchen|^hood|^toaster/i.test(stem)) {
    return {
      category: "kitchen-and-appliances",
      subcategory: "appliances",
      placement: "floor",
      tags: ["kitchen"],
    };
  }
  if (/^television|^computer|^laptop|^radio|^speaker/i.test(stem)) {
    return { category: "electronics", subcategory: "devices", placement: "surface", tags: ["electronics"] };
  }
  if (/^lampSquareCeiling|^ceilingFan/i.test(stem)) {
    return { category: "lighting", subcategory: "ceiling", placement: "ceiling", tags: ["light"] };
  }
  if (/^lampWall/i.test(stem)) {
    return { category: "lighting", subcategory: "wall", placement: "wall", tags: ["light"] };
  }
  if (/^lamp/i.test(stem)) {
    return { category: "lighting", subcategory: "lamps", placement: "floor", tags: ["light"] };
  }
  if (/^washer|^dryer|^trashcan/i.test(stem)) {
    return { category: "utility", subcategory: "utility", placement: "floor", tags: ["utility"] };
  }
  return { category: "decor", subcategory: "decor", placement: "floor", tags: ["decor"] };
}
