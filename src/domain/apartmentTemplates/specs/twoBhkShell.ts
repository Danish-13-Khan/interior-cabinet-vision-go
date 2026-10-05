import type { ApartmentTemplateSpec } from "../types";
import { DEFAULT_FINISH_ROLES } from "./finishRoles";

/**
 * 2 BHK shell ≈ 10200×7800 (80 m²). Content authored in Phase 5.
 * West: kitchen + passage (common bath, hall) over living. East: kids
 * (north, off the hall) over a master suite — walk-in + master bath strip
 * above a full-width master (4800×3200) that opens off the living room.
 */
export const TWO_BHK_SHELL_SPEC: ApartmentTemplateSpec = {
  id: "template:apartment:2bhk:v1",
  name: "2 BHK · Moody walnut",
  description: "Living, parallel kitchen, master suite + kids, baths, passage",
  styleId: "moody-walnut",
  lightingRecipeId: "warm-evening",
  mood: "evening",
  shell: {
    widthMm: 10200,
    depthMm: 7800,
    heightMm: 2850,
    externalWallMm: 230,
    internalWallMm: 115,
  },
  splits: [
    { key: "west-east", inCell: "root", axis: "x", atMm: 300, cells: ["west", "east"] },
    { key: "living-south", inCell: "west", axis: "z", atMm: -400, cells: ["kitchen-block", "living"] },
    { key: "kitchen-passage", inCell: "kitchen-block", axis: "x", atMm: -1800, cells: ["kitchen", "passage"] },
    { key: "common-bath", inCell: "passage", axis: "z", atMm: -2300, cells: ["common-bath", "hall"] },
    { key: "kids-master", inCell: "east", axis: "z", atMm: -1100, cells: ["kids", "master-block"] },
    { key: "master-suite", inCell: "master-block", axis: "z", atMm: 700, cells: ["suite-strip", "master"] },
    { key: "walkin-bath", inCell: "suite-strip", axis: "x", atMm: 2700, cells: ["walk-in", "master-bath"] },
  ],
  rooms: [
    { key: "living", cell: "living", name: "Living", roomType: "living-room", compose: { kind: "none" } },
    { key: "kitchen", cell: "kitchen", name: "Kitchen", roomType: "kitchen", compose: { kind: "none" } },
    { key: "master", cell: "master", name: "Master", roomType: "bedroom", compose: { kind: "none" } },
    { key: "walk-in", cell: "walk-in", name: "Walk-in", roomType: "custom", compose: { kind: "none" } },
    { key: "kids", cell: "kids", name: "Kids", roomType: "bedroom", compose: { kind: "none" } },
    { key: "master-bath", cell: "master-bath", name: "Master Bath", roomType: "bathroom", compose: { kind: "none" } },
    { key: "common-bath", cell: "common-bath", name: "Bath", roomType: "bathroom", compose: { kind: "none" } },
    { key: "hall", cell: "hall", name: "Passage", roomType: "custom", compose: { kind: "none" } },
  ],
  openings: [
    { kind: "door", between: ["living", "hall"], offsetMm: 600, widthMm: 900 },
    { kind: "door", between: ["hall", "common-bath"], offsetMm: 700, widthMm: 700 },
    { kind: "door", between: ["hall", "kids"], offsetMm: 200, widthMm: 800 },
    { kind: "door", between: ["living", "master"], offsetMm: 300, widthMm: 900 },
    { kind: "door", between: ["master", "master-bath"], offsetMm: 300, widthMm: 700 },
    { kind: "opening", between: ["master", "walk-in"], offsetMm: 1200, widthMm: 900 },
    { kind: "opening", between: ["living", "kitchen"], offsetMm: 400, widthMm: 1200 },
    { kind: "door", between: { room: "living", side: "west" }, offsetMm: 500, widthMm: 900 },
    { kind: "window", between: { room: "living", side: "south" }, offsetMm: 1800, widthMm: 1800, sillHeightMm: 900 },
    { kind: "window", between: { room: "master", side: "south" }, offsetMm: 1500, widthMm: 1800, sillHeightMm: 900 },
    { kind: "window", between: { room: "kids", side: "east" }, offsetMm: 800, widthMm: 1200, sillHeightMm: 900 },
  ],
  heroRoomKey: "living",
  finishRoles: { ...DEFAULT_FINISH_ROLES },
};
