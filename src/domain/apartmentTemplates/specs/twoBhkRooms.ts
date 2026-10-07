import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentRoomSpec } from "../types";

const floor = LIVING_ROOM_MATERIAL_IDS.warmStone;

/** 2 BHK room composition (§4): parallel push kitchen, cup kids, study in living. */
export const TWO_BHK_ROOMS: readonly ApartmentRoomSpec[] = [
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
        featureWallPreset: "full",
        displayNiche: true,
        sofaSet: true,
        coveLight: true,
        cobLight: true,
        pendantLight: true,
        studyCorner: true,
      },
    },
    camera: {
      // Wide, high three-quarter view from the far corner: the tour's opening shot and the card still.
      eyeMm: { x: -4950, y: 2650, z: 3750 },
      targetMm: { x: -1700, y: 500, z: 300 },
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
        layout: "parallel",
        runSide: "north",
        secondarySide: "south",
        wallCabinets: true,
        tallPantry: true,
        frontSystem: "push",
        pushMechanism: "tip-on",
        doorStyle: "slab",
        doorSourcing: "in-house",
        wallDoorStyle: "glass",
        underCabinetLights: true,
        cobLight: true,
      },
    },
  },
  {
    key: "master",
    cell: "master",
    name: "Master",
    roomType: "bedroom",
    floorMaterialId: floor,
    compose: {
      kind: "bedroom",
      options: {
        wardrobeSide: "east",
        wardrobeWidthMm: 2100,
        bedAlongSide: "south",
        headboardDecor: "custom",
        pendants: false,
        frontSystem: "push",
        pushMechanism: "tip-on",
        doorStyle: "slab",
        doorSourcing: "in-house",
        cobLight: true,
      },
    },
  },
  {
    key: "kids",
    cell: "kids",
    name: "Kids",
    roomType: "bedroom",
    floorMaterialId: floor,
    compose: {
      kind: "bedroom",
      options: {
        wardrobeSide: "south",
        wardrobeWidthMm: 1800,
        bedAlongSide: "north",
        pendants: true,
        frontSystem: "handled",
        doorStyle: "slab",
        doorSourcing: "in-house",
        handleId: "handle-cup",
        cobLight: true,
      },
    },
  },
  {
    key: "master-bath",
    cell: "master-bath",
    name: "Master Bath",
    roomType: "bathroom",
    floorMaterialId: floor,
    compose: {
      kind: "bathroom",
      options: { vanitySide: "north", mirrorRopeLight: true, cobLight: true },
    },
  },
  {
    key: "common-bath",
    cell: "common-bath",
    name: "Bath",
    roomType: "bathroom",
    floorMaterialId: floor,
    compose: {
      kind: "bathroom",
      options: { vanitySide: "west", mirrorRopeLight: true, cobLight: true },
    },
  },
  {
    key: "hall",
    cell: "hall",
    name: "Passage",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
  },
  {
    key: "walk-in",
    cell: "walk-in",
    name: "Walk-in",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
  },
];
