import type { ApartmentTemplateSpec } from "../types";
import { DEFAULT_FINISH_ROLES } from "./finishRoles";

/** Studio shell ≈ 6000×5400 (32 m²). Content authored in Phase 4. */
export const STUDIO_SHELL_SPEC: ApartmentTemplateSpec = {
  id: "template:apartment:studio:v1",
  name: "Studio · Nordic light",
  description: "Open studio with bath and kitchenette strip",
  styleId: "nordic-light",
  lightingRecipeId: "daylight",
  mood: "day",
  shell: {
    widthMm: 6000,
    depthMm: 5400,
    heightMm: 2850,
    externalWallMm: 230,
    internalWallMm: 115,
  },
  splits: [
    {
      key: "front-back",
      inCell: "root",
      axis: "z",
      atMm: -900,
      cells: ["back", "front"],
    },
    {
      key: "bath-entry",
      inCell: "back",
      axis: "x",
      atMm: -900,
      cells: ["bath", "entry"],
    },
  ],
  rooms: [
    {
      key: "bath",
      cell: "bath",
      name: "Bath",
      roomType: "bathroom",
      compose: { kind: "none" },
    },
    {
      key: "entry",
      cell: "entry",
      name: "Entry",
      roomType: "kitchen",
      compose: { kind: "none" },
    },
    {
      key: "living",
      cell: "front",
      name: "Living",
      roomType: "living-room",
      compose: { kind: "none" },
    },
  ],
  openings: [
    {
      kind: "opening",
      between: ["entry", "living"],
      offsetMm: 400,
      widthMm: 1200,
      heightMm: 2100,
    },
    {
      kind: "door",
      between: ["bath", "entry"],
      offsetMm: 200,
      widthMm: 800,
      heightMm: 2100,
    },
    {
      kind: "door",
      between: { room: "entry", side: "north" },
      offsetMm: 400,
      widthMm: 900,
      heightMm: 2100,
    },
    {
      kind: "window",
      between: { room: "living", side: "south" },
      offsetMm: 2100,
      widthMm: 1800,
      heightMm: 1400,
      sillHeightMm: 900,
    },
  ],
  heroRoomKey: "living",
  finishRoles: { ...DEFAULT_FINISH_ROLES },
};
