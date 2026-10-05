import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentTemplateSpec } from "../types";
import { ONE_BHK_OPENINGS } from "./oneBhkOpenings";
import { ONE_BHK_ROOMS } from "./oneBhkRooms";

/**
 * 1 BHK ≈ 7500×6700 (50 m²). Warm contemporary · day · daylight (§4).
 * Left: kitchen (north) over living. Right: utility | bath over bedroom.
 */
export const ONE_BHK_SHELL_SPEC: ApartmentTemplateSpec = {
  id: "template:apartment:1bhk:v1",
  name: "1 BHK · Warm contemporary",
  description: "Living, L-kitchen, bedroom, bath, utility",
  styleId: "warm-contemporary",
  lightingRecipeId: "daylight",
  mood: "day",
  shell: {
    widthMm: 7500,
    depthMm: 6700,
    heightMm: 2850,
    externalWallMm: 230,
    internalWallMm: 115,
  },
  splits: [
    {
      key: "left-right",
      inCell: "root",
      axis: "x",
      atMm: 450,
      cells: ["left", "right"],
    },
    {
      key: "living-kitchen",
      inCell: "left",
      axis: "z",
      atMm: -650,
      cells: ["kitchen", "living"],
    },
    {
      key: "bed-wet",
      inCell: "right",
      axis: "z",
      atMm: -650,
      cells: ["wet", "bedroom"],
    },
    {
      key: "utility-bath",
      inCell: "wet",
      axis: "x",
      atMm: 1650,
      cells: ["utility", "bath"],
    },
  ],
  rooms: [...ONE_BHK_ROOMS],
  openings: [...ONE_BHK_OPENINGS],
  heroRoomKey: "living",
  finishRoles: {
    carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    "front-primary": LIVING_ROOM_MATERIAL_IDS.naturalOak,
    "front-accent": LIVING_ROOM_MATERIAL_IDS.walnut,
    worktop: LIVING_ROOM_MATERIAL_IDS.warmStone,
    "wall-panel": LIVING_ROOM_MATERIAL_IDS.wallPaint,
    floor: LIVING_ROOM_MATERIAL_IDS.warmStone,
  },
};
