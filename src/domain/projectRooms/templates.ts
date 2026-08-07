import type { CabinetInstance } from "../cabinetDimensions";
import { DEFAULT_ROOM, type RoomConfig } from "../roomModel";
import { createRoomPresetProject, roomPresets } from "../roomPresets";
import { createDefaultProjectRoom } from "./normalize";
import type { ProjectRoom } from "./types";

export type RoomTemplateId =
  | "empty-room"
  | "kitchen-galley"
  | "small-bedroom"
  | "living-room"
  | "office";

export type RoomTemplate = {
  id: RoomTemplateId;
  label: string;
  description: string;
  build: () => ProjectRoom;
};

function withFreshIds(cabinets: CabinetInstance[], prefix: string): CabinetInstance[] {
  return cabinets.map((cabinet, index) => ({
    ...cabinet,
    id: `${prefix}-${index + 1}`,
  }));
}

function kitchenGalleyCabinets(): CabinetInstance[] {
  return [
    {
      id: "kitchen-base-1",
      name: "Base 600",
      placement: { x: -900, y: 0, z: -1700, rotation: 0, attachment: "floor" },
      config: {
        type: "base",
        dimensions: {
          width: 600,
          height: 720,
          depth: 560,
          boardThickness: 18,
          backPanelThickness: 6,
        },
        shelfCount: 1,
        hasDoors: true,
        drawerCount: 0,
        toeKickHeight: 100,
        toeKickInset: 60,
      },
    },
    {
      id: "kitchen-drawer-1",
      name: "Drawer 600",
      placement: { x: -200, y: 0, z: -1700, rotation: 0, attachment: "floor" },
      config: {
        type: "drawer",
        dimensions: {
          width: 600,
          height: 720,
          depth: 560,
          boardThickness: 18,
          backPanelThickness: 6,
        },
        shelfCount: 0,
        hasDoors: false,
        drawerCount: 3,
        toeKickHeight: 100,
        toeKickInset: 60,
      },
    },
    {
      id: "kitchen-sink-1",
      name: "Sink 900",
      placement: { x: 650, y: 0, z: -1700, rotation: 0, attachment: "floor" },
      config: {
        type: "sink",
        dimensions: {
          width: 900,
          height: 720,
          depth: 560,
          boardThickness: 18,
          backPanelThickness: 6,
        },
        shelfCount: 0,
        hasDoors: true,
        drawerCount: 0,
        toeKickHeight: 100,
        toeKickInset: 60,
      },
    },
  ];
}

const kitchenRoomConfig: RoomConfig = {
  ...DEFAULT_ROOM,
  dimensions: {
    ...DEFAULT_ROOM.dimensions,
    widthMm: 4200,
    depthMm: 3200,
    heightMm: 2700,
  },
};

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "empty-room",
    label: "Empty Room",
    description: "Blank room shell with default dimensions.",
    build: () => createDefaultProjectRoom([], DEFAULT_ROOM, "Empty Room"),
  },
  {
    id: "kitchen-galley",
    label: "Kitchen Galley",
    description: "Compact kitchen base run with drawer and sink units.",
    build: () =>
      createDefaultProjectRoom(
        withFreshIds(kitchenGalleyCabinets(), "tpl-kitchen"),
        kitchenRoomConfig,
        "Kitchen",
      ),
  },
  ...roomPresets.map((preset) => ({
    id: preset.id as RoomTemplateId,
    label: preset.label,
    description: preset.description,
    build: (): ProjectRoom => {
      const project = createRoomPresetProject(preset);
      return createDefaultProjectRoom(
        withFreshIds(project.cabinets, `tpl-${preset.id}`),
        preset.roomConfig,
        preset.label,
      );
    },
  })),
];

export function getRoomTemplate(id: string): RoomTemplate | null {
  return ROOM_TEMPLATES.find((template) => template.id === id) ?? null;
}
