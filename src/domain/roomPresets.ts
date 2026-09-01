import type { CabinetInstance, CabinetProject, CabinetType } from "./cabinetDimensions";
import { withNewCabinetIdentity } from "./cabinetIdentity/copyInstance";
import { DEFAULT_ROOM, type RoomConfig } from "./roomModel";

export type RoomPresetId = "small-bedroom" | "living-room" | "office";

export type RoomPreset = {
  id: RoomPresetId;
  label: string;
  description: string;
  roomConfig: RoomConfig;
  cabinets: CabinetInstance[];
};

const SMALL_BEDROOM_ROOM: RoomConfig = {
  ...DEFAULT_ROOM,
  dimensions: {
    ...DEFAULT_ROOM.dimensions,
    widthMm: 4200,
    depthMm: 3400,
    heightMm: 2700,
  },
};

const LIVING_ROOM_ROOM: RoomConfig = {
  ...DEFAULT_ROOM,
  dimensions: {
    ...DEFAULT_ROOM.dimensions,
    widthMm: 5600,
    depthMm: 4200,
    heightMm: 2800,
  },
};

const OFFICE_ROOM: RoomConfig = {
  ...DEFAULT_ROOM,
  dimensions: {
    ...DEFAULT_ROOM.dimensions,
    widthMm: 4800,
    depthMm: 3600,
    heightMm: 2800,
  },
};

export const roomPresets: RoomPreset[] = [
  {
    id: "small-bedroom",
    label: "Small Bedroom",
    description: "A compact bedroom with a wardrobe, a side table, and a chair.",
    roomConfig: SMALL_BEDROOM_ROOM,
    cabinets: [
      {
        id: "preset-sbr-wardrobe",
        name: "Wardrobe",
        placement: { x: -2200, y: 0, z: -1600, rotation: 0, attachment: "floor" },
        config: {
          type: "almirah",
          dimensions: { width: 1200, height: 2200, depth: 600, boardThickness: 18, backPanelThickness: 6 },
          shelfCount: 4,
          hasDoors: true,
          toeKickHeight: 80,
          toeKickInset: 40,
        },
      },
      {
        id: "preset-sbr-side-table",
        name: "Side Table",
        placement: { x: 1500, y: 0, z: -1200, rotation: 0, attachment: "floor" },
        config: {
          type: "table",
          dimensions: { width: 600, height: 500, depth: 450, boardThickness: 30, backPanelThickness: 18 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
      {
        id: "preset-sbr-chair",
        name: "Chair",
        placement: { x: 1200, y: 0, z: -400, rotation: 180, attachment: "floor" },
        config: {
          type: "chair",
          dimensions: { width: 500, height: 900, depth: 520, boardThickness: 30, backPanelThickness: 18 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
    ],
  },
  {
    id: "living-room",
    label: "Living Room",
    description: "A living room with a sofa, coffee table, and a storage cabinet.",
    roomConfig: LIVING_ROOM_ROOM,
    cabinets: [
      {
        id: "preset-lr-sofa",
        name: "Sofa",
        placement: { x: 0, y: 0, z: 1200, rotation: 0, attachment: "floor" },
        config: {
          type: "sofa",
          dimensions: { width: 1800, height: 820, depth: 900, boardThickness: 40, backPanelThickness: 30 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
      {
        id: "preset-lr-coffee-table",
        name: "Coffee Table",
        placement: { x: 0, y: 0, z: -200, rotation: 0, attachment: "floor" },
        config: {
          type: "table",
          dimensions: { width: 1000, height: 420, depth: 600, boardThickness: 30, backPanelThickness: 18 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
      {
        id: "preset-lr-tall-cabinet",
        name: "Display Cabinet",
        placement: { x: -2400, y: 0, z: -1200, rotation: 0, attachment: "floor" },
        config: {
          type: "tall",
          dimensions: { width: 600, height: 2100, depth: 600, boardThickness: 18, backPanelThickness: 6 },
          shelfCount: 4,
          hasDoors: true,
          toeKickHeight: 100,
          toeKickInset: 60,
        },
      },
    ],
  },
  {
    id: "office",
    label: "Office",
    description: "A home office with a desk, chair, and storage cabinet.",
    roomConfig: OFFICE_ROOM,
    cabinets: [
      {
        id: "preset-of-desk",
        name: "Desk",
        placement: { x: 0, y: 0, z: -1400, rotation: 0, attachment: "floor" },
        config: {
          type: "table",
          dimensions: { width: 1600, height: 740, depth: 750, boardThickness: 36, backPanelThickness: 18 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
      {
        id: "preset-of-chair",
        name: "Office Chair",
        placement: { x: 0, y: 0, z: -500, rotation: 0, attachment: "floor" },
        config: {
          type: "chair",
          dimensions: { width: 540, height: 950, depth: 560, boardThickness: 30, backPanelThickness: 18 },
          shelfCount: 0,
          hasDoors: false,
          toeKickHeight: 0,
          toeKickInset: 0,
        },
      },
      {
        id: "preset-of-tall-cabinet",
        name: "Filing Cabinet",
        placement: { x: 2200, y: 0, z: -1400, rotation: 0, attachment: "floor" },
        config: {
          type: "tall",
          dimensions: { width: 600, height: 2100, depth: 600, boardThickness: 18, backPanelThickness: 6 },
          shelfCount: 3,
          hasDoors: true,
          toeKickHeight: 100,
          toeKickInset: 60,
        },
      },
    ],
  },
];

export type ObjectCategoryId = "storage" | "seating" | "tables" | "decor";

export type ObjectCategory = {
  id: ObjectCategoryId;
  label: string;
  types: CabinetType[];
};

export const objectCategories: ObjectCategory[] = [
  {
    id: "storage",
    label: "Storage",
    types: ["base", "wall", "tall", "almirah"],
  },
  {
    id: "seating",
    label: "Seating",
    types: ["chair", "sofa"],
  },
  {
    id: "tables",
    label: "Tables",
    types: ["table"],
  },
  {
    id: "decor",
    label: "Decor",
    types: ["mirror"],
  },
];

export function createRoomPresetProject(preset: RoomPreset): CabinetProject {
  return {
    version: 1,
    cabinets: preset.cabinets.map((cabinet, index) =>
      withNewCabinetIdentity(
        cabinet,
        `${preset.id}-${cabinet.id.split("-").slice(-1)[0]}-${Date.now()}-${index}`,
      ),
    ),
  };
}
