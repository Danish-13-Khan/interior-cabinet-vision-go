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
      // Wide, high three-quarter view from the far corner: the tour's opening shot and the card still.
      // Eye at z −100 (not −900) so the centre pendant reads against the fluted wall, not on the niche top.
      eyeMm: { x: -6100, y: 2450, z: -100 },
      targetMm: { x: -1200, y: 800, z: 2100 },
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
  },
  {
    key: "utility",
    cell: "utility",
    name: "Utility",
    roomType: "utility",
    floorMaterialId: floor,
    compose: { kind: "utility", options: { tallUnitSide: "west" } },
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
  },
  {
    key: "balcony",
    cell: "balcony",
    name: "Balcony",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
  },
  {
    key: "passage",
    cell: "passage",
    name: "Passage",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
  },
];
