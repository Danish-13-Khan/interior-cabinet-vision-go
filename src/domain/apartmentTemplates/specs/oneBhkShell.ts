import type { ApartmentTemplateSpec } from "../types";
import { DEFAULT_FINISH_ROLES } from "./finishRoles";

/** 1 BHK shell ≈ 7500×6700 (50 m²). Content authored in Phase 4. */
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
      key: "bath-utility",
      inCell: "wet",
      axis: "x",
      atMm: 2550,
      cells: ["bath", "utility"],
    },
  ],
  rooms: [
    {
      key: "living",
      cell: "living",
      name: "Living",
      roomType: "living-room",
      compose: { kind: "none" },
    },
    {
      key: "kitchen",
      cell: "kitchen",
      name: "Kitchen",
      roomType: "kitchen",
      compose: { kind: "none" },
    },
    {
      key: "bedroom",
      cell: "bedroom",
      name: "Bedroom",
      roomType: "bedroom",
      compose: { kind: "none" },
    },
    {
      key: "bath",
      cell: "bath",
      name: "Bath",
      roomType: "bathroom",
      compose: { kind: "none" },
    },
    {
      key: "utility",
      cell: "utility",
      name: "Utility",
      roomType: "utility",
      compose: { kind: "none" },
    },
  ],
  openings: [
    {
      kind: "door",
      between: ["living", "bedroom"],
      offsetMm: 400,
      widthMm: 900,
    },
    {
      kind: "door",
      between: ["kitchen", "bath"],
      offsetMm: 200,
      widthMm: 800,
    },
    {
      kind: "door",
      between: ["bath", "utility"],
      offsetMm: 100,
      widthMm: 700,
    },
    {
      kind: "opening",
      between: ["living", "kitchen"],
      offsetMm: 600,
      widthMm: 1400,
    },
    {
      kind: "door",
      between: { room: "living", side: "west" },
      offsetMm: 400,
      widthMm: 900,
    },
    {
      kind: "window",
      between: { room: "living", side: "south" },
      offsetMm: 800,
      widthMm: 1600,
      sillHeightMm: 900,
    },
    {
      kind: "window",
      between: { room: "bedroom", side: "east" },
      offsetMm: 600,
      widthMm: 1200,
      sillHeightMm: 900,
    },
  ],
  heroRoomKey: "living",
  finishRoles: { ...DEFAULT_FINISH_ROLES },
};
