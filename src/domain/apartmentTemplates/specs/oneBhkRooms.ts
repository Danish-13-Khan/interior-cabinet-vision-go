import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentRoomSpec } from "../types";

const floor = LIVING_ROOM_MATERIAL_IDS.warmStone;

/** 1 BHK room composition, materials, and showcase cameras (§4). */
export const ONE_BHK_ROOMS: readonly ApartmentRoomSpec[] = [
  {
    key: "living",
    cell: "living",
    name: "Living",
    roomType: "living-room",
    floorMaterialId: floor,
    compose: {
      kind: "living",
      options: {
        tvWallSide: "north",
        featureWallPreset: "vertical",
        displayNiche: false,
        sofaSet: true,
        coveLight: false,
        trackLight: true,
        panelLight: true,
        downlight: true,
      },
    },
    camera: {
      // From the far corner onto the TV console wall (the tour still / card thumbnail).
      eyeMm: { x: -3100, y: 1600, z: 2900 },
      targetMm: { x: -700, y: 1000, z: -400 },
    },
  },
  {
    key: "kitchen",
    cell: "kitchen",
    name: "Kitchen",
    roomType: "kitchen",
    floorMaterialId: floor,
    compose: {
      kind: "kitchen",
      options: {
        layout: "L",
        runSide: "north",
        secondarySide: "west",
        wallCabinets: true,
        tallPantry: true,
        frontSystem: "handled",
        doorStyle: "shaker",
        doorSourcing: "bought",
        handleId: "handle-bar",
        underCabinetLights: true,
        downlight: true,
      },
    },
    camera: {
      eyeMm: { x: -800, y: 1600, z: -900 },
      targetMm: { x: -2200, y: 1100, z: -2400 },
    },
  },
  {
    key: "bedroom",
    cell: "bedroom",
    name: "Bedroom",
    roomType: "bedroom",
    floorMaterialId: floor,
    compose: {
      kind: "bedroom",
      options: {
        wardrobeSide: "west",
        wardrobeWidthMm: 1800,
        bedAlongSide: "east",
        headboardDecor: "wainscot",
        pendants: true,
        frontSystem: "handled",
        doorStyle: "slab",
        doorSourcing: "bought",
        handleId: "handle-knob",
        downlight: true,
      },
    },
    camera: {
      eyeMm: { x: 1400, y: 1600, z: 2800 },
      targetMm: { x: 2400, y: 1100, z: 800 },
    },
  },
  {
    key: "bath",
    cell: "bath",
    name: "Bath",
    roomType: "bathroom",
    floorMaterialId: floor,
    compose: {
      kind: "bathroom",
      options: { vanitySide: "north", mirrorRopeLight: true, downlight: true },
    },
    camera: {
      eyeMm: { x: 2700, y: 1600, z: -1100 },
      targetMm: { x: 2700, y: 1100, z: -2400 },
    },
  },
  {
    key: "utility",
    cell: "utility",
    name: "Utility",
    roomType: "utility",
    floorMaterialId: floor,
    compose: {
      kind: "utility",
      options: { tallUnitSide: "east" },
    },
    camera: {
      eyeMm: { x: 1050, y: 1600, z: -1100 },
      targetMm: { x: 1050, y: 1100, z: -2400 },
    },
  },
];
