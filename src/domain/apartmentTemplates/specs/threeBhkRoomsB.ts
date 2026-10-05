import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import type { ApartmentRoomSpec } from "../types";

const floor = LIVING_ROOM_MATERIAL_IDS.warmStone;

/** 3 BHK bedrooms and baths (§4): sliding master, push corner wardrobe (kids), guest hinged. */
export const THREE_BHK_ROOMS_B: readonly ApartmentRoomSpec[] = [
  {
    key: "guest",
    cell: "guest",
    name: "Guest",
    roomType: "bedroom",
    floorMaterialId: floor,
    compose: {
      kind: "bedroom",
      options: {
        // West: the east wall's longest free run (1600) was too short, so no wardrobe placed.
        wardrobeSide: "west",
        wardrobeWidthMm: 1800,
        bedAlongSide: "north",
        headboardDecor: "moulding",
        pendants: true,
        frontSystem: "handled",
        doorStyle: "shaker",
        doorSourcing: "bought",
        handleId: "handle-bar",
        cobLight: true,
      },
    },
    camera: {
      eyeMm: { x: 2000, y: 1600, z: -1600 },
      targetMm: { x: 3000, y: 1100, z: -3200 },
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
        wardrobeSide: "west",
        wardrobeWidthMm: 900,
        bedAlongSide: "south",
        headboardDecor: "horizontal",
        pendants: true,
        frontSystem: "push",
        pushMechanism: "tip-on",
        doorStyle: "slab",
        doorSourcing: "bought",
        cornerWardrobe: true,
        cobLight: true,
      },
    },
    camera: {
      eyeMm: { x: 450, y: 1600, z: 3600 },
      targetMm: { x: 450, y: 1100, z: 1400 },
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
        wardrobeSide: "west",
        wardrobeWidthMm: 2400,
        bedAlongSide: "south",
        headboardDecor: "profile",
        pendants: true,
        wardrobeDoors: "sliding",
        doorStyle: "shaker",
        doorSourcing: "in-house",
        cobLight: true,
      },
    },
    camera: {
      eyeMm: { x: 2500, y: 1600, z: 3600 },
      targetMm: { x: 3600, y: 1100, z: 1600 },
    },
  },
  {
    key: "guest-bath",
    cell: "guest-bath",
    name: "Guest Bath",
    roomType: "bathroom",
    floorMaterialId: floor,
    compose: {
      kind: "bathroom",
      options: { vanitySide: "east", mirrorRopeLight: true, cobLight: true },
    },
    camera: {
      eyeMm: { x: 5000, y: 1600, z: -3000 },
      targetMm: { x: 5600, y: 1100, z: -4000 },
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
      options: { vanitySide: "east", mirrorRopeLight: true, cobLight: true },
    },
    camera: {
      eyeMm: { x: 5000, y: 1600, z: -1400 },
      targetMm: { x: 5600, y: 1100, z: -2200 },
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
      eyeMm: { x: 5550, y: 1600, z: 2000 },
      targetMm: { x: 5550, y: 1100, z: 800 },
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
      eyeMm: { x: 5550, y: 1600, z: 4000 },
      targetMm: { x: 5550, y: 1100, z: 3000 },
    },
  },
];
