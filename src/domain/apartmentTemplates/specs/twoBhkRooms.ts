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
      eyeMm: { x: -2400, y: 1600, z: 3400 },
      targetMm: { x: -2400, y: 1000, z: 0 },
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
    camera: {
      eyeMm: { x: -2800, y: 1600, z: -800 },
      targetMm: { x: -3450, y: 1100, z: -2800 },
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
    camera: {
      eyeMm: { x: 1800, y: 1600, z: 3200 },
      targetMm: { x: 3000, y: 1100, z: 1400 },
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
    camera: {
      eyeMm: { x: 2200, y: 1600, z: -1600 },
      targetMm: { x: 3000, y: 1100, z: -2800 },
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
    camera: {
      eyeMm: { x: 3900, y: 1600, z: 400 },
      targetMm: { x: 3900, y: 1100, z: -600 },
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
    camera: {
      eyeMm: { x: -400, y: 1600, z: -2700 },
      targetMm: { x: -1000, y: 1100, z: -3400 },
    },
  },
  {
    key: "hall",
    cell: "hall",
    name: "Passage",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
    camera: {
      eyeMm: { x: -750, y: 1600, z: -800 },
      targetMm: { x: -750, y: 1100, z: -1800 },
    },
  },
  {
    key: "walk-in",
    cell: "walk-in",
    name: "Walk-in",
    roomType: "custom",
    floorMaterialId: floor,
    compose: { kind: "none" },
    camera: {
      eyeMm: { x: 1500, y: 1600, z: 400 },
      targetMm: { x: 1500, y: 1100, z: -600 },
    },
  },
];
