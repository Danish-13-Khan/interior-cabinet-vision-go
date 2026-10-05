import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentRoomSpec } from "../types";

const floor = LIVING_ROOM_MATERIAL_IDS.warmStone;

/** 3 BHK west / service rooms (§4). */
export const THREE_BHK_ROOMS_A: readonly ApartmentRoomSpec[] = [
  {
    key: "foyer",
    cell: "foyer",
    name: "Foyer",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "foyer", options: { shoeCabinetSide: "east" } },
    camera: {
      eyeMm: { x: -1650, y: 1600, z: -1400 },
      targetMm: { x: -1650, y: 1100, z: -3200 },
    },
  },
  {
    key: "living",
    cell: "living",
    name: "Living",
    roomType: "living-room",
    floorMaterialId: floor,
    compose: {
      kind: "living",
      options: {
        // North is arches to kitchen / passage; the east wall is the one free 3.2 m piece.
        tvWallSide: "east",
        featureWallPreset: "slat",
        displayNiche: true,
        sofaSet: true,
        coveLight: true,
        trackLight: true,
        cobLight: true,
        pendantLight: true,
        profileLight: true,
      },
    },
    camera: {
      eyeMm: { x: -5600, y: 1600, z: 1800 },
      targetMm: { x: -1200, y: 1000, z: 1800 },
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
        runSide: "east",
        secondarySide: "north",
        wallCabinets: true,
        tallPantry: true,
        frontSystem: "gola",
        doorStyle: "shaker",
        doorSourcing: "in-house",
        wallDoorStyle: "glass",
        underCabinetLights: true,
        profileLight: true,
        cobLight: true,
      },
    },
    camera: {
      eyeMm: { x: -3000, y: 1600, z: -1600 },
      targetMm: { x: -4000, y: 1100, z: -3200 },
    },
  },
  {
    key: "utility",
    cell: "utility",
    name: "Utility",
    roomType: "utility",
    floorMaterialId: floor,
    compose: { kind: "utility", options: { tallUnitSide: "west" } },
    camera: {
      eyeMm: { x: -5700, y: 1600, z: -1600 },
      targetMm: { x: -5700, y: 1100, z: -3200 },
    },
  },
  {
    key: "study",
    cell: "study",
    name: "Study",
    roomType: "office",
    floorMaterialId: floor,
    compose: {
      kind: "study",
      options: { deskSide: "north", openShelfSide: "east" },
    },
    camera: {
      eyeMm: { x: 0, y: 1600, z: -1600 },
      targetMm: { x: 0, y: 1100, z: -3200 },
    },
  },
  {
    key: "balcony",
    cell: "balcony",
    name: "Balcony",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
    camera: {
      eyeMm: { x: -3600, y: 1600, z: 4200 },
      targetMm: { x: -3600, y: 900, z: 3600 },
    },
  },
  {
    key: "passage",
    cell: "passage",
    name: "Passage",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
    camera: {
      eyeMm: { x: 1200, y: 1600, z: -450 },
      targetMm: { x: 4000, y: 1100, z: -450 },
    },
  },
];
