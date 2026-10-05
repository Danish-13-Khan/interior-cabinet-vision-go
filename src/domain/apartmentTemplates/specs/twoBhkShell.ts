import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentTemplateSpec } from "../types";
import { TWO_BHK_ROOMS } from "./twoBhkRooms";

/**
 * 2 BHK ≈ 10200×7800 (80 m²). Moody walnut · evening · warm-evening (§4).
 * West: kitchen + passage over living. East: kids over master suite.
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
  rooms: [...TWO_BHK_ROOMS],
  openings: [
    { kind: "door", between: ["living", "hall"], offsetMm: 600, widthMm: 900 },
    { kind: "door", between: ["hall", "common-bath"], offsetMm: 700, widthMm: 700 },
    { kind: "door", between: ["hall", "kids"], offsetMm: 200, widthMm: 800 },
    { kind: "door", between: ["living", "master"], offsetMm: 300, widthMm: 900 },
    { kind: "door", between: ["master", "master-bath"], offsetMm: 300, widthMm: 700 },
    { kind: "opening", between: ["master", "walk-in"], offsetMm: 1200, widthMm: 900 },
    // West end so the kitchen's parallel run and the living TV wall share a 2.2 m free piece.
    { kind: "opening", between: ["living", "kitchen"], offsetMm: 150, widthMm: 1000 },
    { kind: "door", between: { room: "living", side: "west" }, offsetMm: 500, widthMm: 900 },
    // Kitchen daylight on the free outside (west) wall between the two runs.
    { kind: "window", between: { room: "kitchen", side: "west" }, offsetMm: 1300, widthMm: 900, heightMm: 1100, sillHeightMm: 1000 },
    { kind: "window", between: { room: "living", side: "south" }, offsetMm: 1800, widthMm: 1800, sillHeightMm: 900 },
    { kind: "window", between: { room: "master", side: "south" }, offsetMm: 1500, widthMm: 1800, sillHeightMm: 900 },
    { kind: "window", between: { room: "kids", side: "east" }, offsetMm: 800, widthMm: 1200, sillHeightMm: 900 },
  ],
  heroRoomKey: "living",
  finishRoles: {
    carcass: LIVING_ROOM_MATERIAL_IDS.walnut,
    "front-primary": LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
    "front-accent": LIVING_ROOM_MATERIAL_IDS.walnut,
    worktop: LIVING_ROOM_MATERIAL_IDS.warmStone,
    "wall-panel": LIVING_ROOM_MATERIAL_IDS.walnut,
    floor: LIVING_ROOM_MATERIAL_IDS.warmStone,
  },
};
