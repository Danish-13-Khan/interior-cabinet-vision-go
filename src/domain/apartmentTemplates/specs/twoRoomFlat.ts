import { LIVING_ROOM_DIMENSIONS } from "../../livingRoom/preset";
import type { ApartmentTemplateSpec } from "../types";
import { DEFAULT_FINISH_ROLES } from "./finishRoles";

/**
 * Re-expresses planner starter `"2-room-flat"` as an ApartmentTemplateSpec.
 * Same outer size and a full-depth split on x = 0.
 */
export const TWO_ROOM_FLAT_SPEC: ApartmentTemplateSpec = {
  id: "template:apartment:2-room-flat:check",
  name: "2-room flat (topology check)",
  description: "Parity check against plannerStarters createTwoRoomFlatStarter",
  styleId: "warm-contemporary",
  lightingRecipeId: "neutral-studio",
  mood: "day",
  shell: {
    widthMm: LIVING_ROOM_DIMENSIONS.widthMm,
    depthMm: LIVING_ROOM_DIMENSIONS.depthMm,
    heightMm: LIVING_ROOM_DIMENSIONS.heightMm,
    externalWallMm: LIVING_ROOM_DIMENSIONS.wallThicknessMm,
    internalWallMm: LIVING_ROOM_DIMENSIONS.wallThicknessMm,
  },
  splits: [
    {
      key: "living-bedroom",
      inCell: "root",
      axis: "x",
      atMm: 0,
      cells: ["west", "east"],
    },
  ],
  rooms: [
    {
      key: "living",
      cell: "west",
      name: "Living",
      roomType: "living-room",
      compose: { kind: "none" },
    },
    {
      key: "bedroom",
      cell: "east",
      name: "Bedroom",
      roomType: "bedroom",
      compose: { kind: "none" },
    },
  ],
  openings: [],
  heroRoomKey: "living",
  finishRoles: { ...DEFAULT_FINISH_ROLES },
};
