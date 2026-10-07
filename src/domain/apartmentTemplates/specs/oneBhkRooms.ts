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
      // Wide, high three-quarter view from the far corner: the tour's opening shot and the card still.
      eyeMm: { x: -3550, y: 2350, z: 3150 },
      targetMm: { x: -800, y: 800, z: -200 },
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
  },
];
