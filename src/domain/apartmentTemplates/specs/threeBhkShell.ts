import type { ApartmentTemplateSpec } from "../types";
import { DEFAULT_FINISH_ROLES } from "./finishRoles";

/**
 * 3 BHK shell ≈ 12600×9200 (115 m²). Also doubles as D2 spike (≥8 cuts,
 * including T-junctions and a four-way node from nested guillotine splits).
 *
 * West: utility | kitchen | foyer (north) over living over a 1200 balcony.
 * The foyer opens into the living room; entry is on the foyer's north wall.
 * East: study | guest | guest bath + common bath (north band), a 1300 passage
 * off the living room, then kids | master | master bath + walk-in. Every
 * bedroom and the common bath open off the passage.
 */
export const THREE_BHK_SHELL_SPEC: ApartmentTemplateSpec = {
  id: "template:apartment:3bhk:v1",
  name: "3 BHK · Premium warm",
  description: "Foyer, living, kitchen, three bedrooms, study, passage, baths, utility, balcony",
  styleId: "warm-contemporary",
  lightingRecipeId: "warm-evening",
  mood: "evening",
  shell: {
    widthMm: 12600,
    depthMm: 9200,
    heightMm: 2850,
    externalWallMm: 230,
    internalWallMm: 115,
  },
  splits: [
    { key: "west-east", inCell: "root", axis: "x", atMm: -900, cells: ["west", "east"] },
    { key: "west-service", inCell: "west", axis: "z", atMm: -1100, cells: ["service", "west-south"] },
    { key: "living-balcony", inCell: "west-south", axis: "z", atMm: 3400, cells: ["living", "balcony"] },
    { key: "kitchen-foyer", inCell: "service", axis: "x", atMm: -2400, cells: ["kitchen-block", "foyer"] },
    { key: "utility-kitchen", inCell: "kitchen-block", axis: "x", atMm: -5100, cells: ["utility", "kitchen"] },
    { key: "east-north", inCell: "east", axis: "z", atMm: -1100, cells: ["north-band", "east-south"] },
    { key: "passage", inCell: "east-south", axis: "z", atMm: 200, cells: ["passage", "bed-band"] },
    { key: "study-guest", inCell: "north-band", axis: "x", atMm: 900, cells: ["study", "guest-block"] },
    { key: "guest-baths", inCell: "guest-block", axis: "x", atMm: 4500, cells: ["guest", "bath-strip"] },
    { key: "guest-common-bath", inCell: "bath-strip", axis: "z", atMm: -2700, cells: ["guest-bath", "common-bath"] },
    { key: "kids-master", inCell: "bed-band", axis: "x", atMm: 1800, cells: ["kids", "master-block"] },
    { key: "master-suite", inCell: "master-block", axis: "x", atMm: 4800, cells: ["master", "suite-strip"] },
    { key: "master-bath-walkin", inCell: "suite-strip", axis: "z", atMm: 2600, cells: ["master-bath", "walk-in"] },
  ],
  rooms: [
    { key: "foyer", cell: "foyer", name: "Foyer", roomType: "custom", compose: { kind: "none" } },
    { key: "living", cell: "living", name: "Living", roomType: "living-room", compose: { kind: "none" } },
    { key: "balcony", cell: "balcony", name: "Balcony", roomType: "custom", compose: { kind: "none" } },
    { key: "kitchen", cell: "kitchen", name: "Kitchen", roomType: "kitchen", compose: { kind: "none" } },
    { key: "utility", cell: "utility", name: "Utility", roomType: "utility", compose: { kind: "none" } },
    { key: "passage", cell: "passage", name: "Passage", roomType: "custom", compose: { kind: "none" } },
    { key: "study", cell: "study", name: "Study", roomType: "office", compose: { kind: "none" } },
    { key: "guest", cell: "guest", name: "Guest", roomType: "bedroom", compose: { kind: "none" } },
    { key: "guest-bath", cell: "guest-bath", name: "Guest Bath", roomType: "bathroom", compose: { kind: "none" } },
    { key: "common-bath", cell: "common-bath", name: "Bath", roomType: "bathroom", compose: { kind: "none" } },
    { key: "kids", cell: "kids", name: "Kids", roomType: "bedroom", compose: { kind: "none" } },
    { key: "master", cell: "master", name: "Master", roomType: "bedroom", compose: { kind: "none" } },
    { key: "master-bath", cell: "master-bath", name: "Master Bath", roomType: "bathroom", compose: { kind: "none" } },
    { key: "walk-in", cell: "walk-in", name: "Walk-in", roomType: "custom", compose: { kind: "none" } },
  ],
  openings: [
    { kind: "door", between: { room: "foyer", side: "north" }, offsetMm: 250, widthMm: 1000 },
    { kind: "opening", between: ["foyer", "living"], offsetMm: 200, widthMm: 1100 },
    { kind: "door", between: ["foyer", "study"], offsetMm: 2400, widthMm: 800 },
    { kind: "opening", between: ["living", "kitchen"], offsetMm: 600, widthMm: 1400 },
    { kind: "door", between: ["kitchen", "utility"], offsetMm: 2000, widthMm: 700 },
    { kind: "opening", between: ["living", "passage"], offsetMm: 150, widthMm: 1000 },
    { kind: "door", between: ["passage", "guest"], offsetMm: 300, widthMm: 800 },
    { kind: "door", between: ["passage", "common-bath"], offsetMm: 400, widthMm: 700 },
    { kind: "door", between: ["passage", "kids"], offsetMm: 300, widthMm: 800 },
    { kind: "door", between: ["passage", "master"], offsetMm: 300, widthMm: 900 },
    { kind: "door", between: ["guest", "guest-bath"], offsetMm: 600, widthMm: 700 },
    { kind: "door", between: ["master", "master-bath"], offsetMm: 400, widthMm: 700 },
    { kind: "opening", between: ["master", "walk-in"], offsetMm: 400, widthMm: 900 },
    {
      kind: "door",
      between: ["living", "balcony"],
      offsetMm: 1800,
      widthMm: 1800,
      catalogItemId: "opening:door-sliding",
    },
    { kind: "window", between: { room: "living", side: "west" }, offsetMm: 1400, widthMm: 1600, sillHeightMm: 900 },
    { kind: "window", between: { room: "balcony", side: "south" }, offsetMm: 1700, widthMm: 2000, sillHeightMm: 100 },
    { kind: "window", between: { room: "kids", side: "south" }, offsetMm: 700, widthMm: 1200, sillHeightMm: 900 },
    { kind: "window", between: { room: "master", side: "south" }, offsetMm: 800, widthMm: 1400, sillHeightMm: 900 },
    { kind: "window", between: { room: "guest", side: "north" }, offsetMm: 1100, widthMm: 1400, sillHeightMm: 900 },
  ],
  heroRoomKey: "living",
  finishRoles: { ...DEFAULT_FINISH_ROLES },
};
