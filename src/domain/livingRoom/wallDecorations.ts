import type { InteriorProject, Size3Mm, WallEntity } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import { addWallPanel } from "./panelCommands";
import type { LivingRoomCatalogId } from "./catalog";
import { wallLength } from "./wallSegmentPlacement";

export type WallDecorationGroup = "panels" | "moulding" | "decorative" | "mirror";

export type WallDecorationPreset = {
  id: string;
  group: WallDecorationGroup;
  label: string;
  catalogItemId: LivingRoomCatalogId;
  size: (wall: WallEntity) => Size3Mm;
  floorOffsetMm: number;
};

const fitWidth = (wall: WallEntity, widthMm: number) =>
  Math.max(40, Math.min(widthMm, wallLength(wall)));

const fixed = (widthMm: number, heightMm: number, depthMm: number) =>
  (wall: WallEntity): Size3Mm => ({
    widthMm: fitWidth(wall, widthMm),
    heightMm: Math.min(heightMm, wall.heightMm),
    depthMm,
  });

/** Presets for the wall window. Slat, custom, and mirror reuse existing items. */
export const WALL_DECORATION_PRESETS: readonly WallDecorationPreset[] = [
  {
    id: "full",
    group: "panels",
    label: "Full-height panel",
    catalogItemId: "living:wall-panel-full",
    size: (wall) => ({
      widthMm: fitWidth(wall, wallLength(wall) / 3),
      heightMm: wall.heightMm,
      depthMm: 18,
    }),
    floorOffsetMm: 0,
  },
  {
    id: "vertical",
    group: "panels",
    label: "Vertical panel",
    catalogItemId: "living:wall-panel-vertical",
    size: fixed(600, 2400, 18),
    floorOffsetMm: 0,
  },
  {
    id: "horizontal",
    group: "panels",
    label: "Horizontal panel",
    catalogItemId: "living:wall-panel-horizontal",
    size: fixed(2400, 600, 18),
    floorOffsetMm: 900,
  },
  {
    id: "wainscot",
    group: "panels",
    label: "Wainscot",
    catalogItemId: "living:wainscot-panel",
    size: fixed(1200, 900, 22),
    floorOffsetMm: 0,
  },
  {
    id: "moulding",
    group: "moulding",
    label: "Moulding",
    catalogItemId: "living:moulding-strip",
    size: fixed(2400, 60, 24),
    floorOffsetMm: 900,
  },
  {
    id: "profile",
    group: "moulding",
    label: "Profile strip",
    catalogItemId: "living:profile-strip",
    size: fixed(40, 2400, 18),
    floorOffsetMm: 0,
  },
  {
    id: "slat",
    group: "decorative",
    label: "Slat panel",
    catalogItemId: "living:feature-wall-fluted",
    size: fixed(3600, 2200, 62),
    floorOffsetMm: 0,
  },
  {
    id: "custom",
    group: "decorative",
    label: "Custom section",
    catalogItemId: "living:decorative-panel",
    size: fixed(1200, 2400, 24),
    floorOffsetMm: 0,
  },
  {
    id: "mirror",
    group: "mirror",
    label: "Mirror",
    catalogItemId: "living:wall-mirror",
    size: fixed(900, 1400, 35),
    floorOffsetMm: 850,
  },
];

export function getWallDecorationPreset(presetId: string) {
  return WALL_DECORATION_PRESETS.find((preset) => preset.id === presetId) ?? null;
}

/** Place a decoration preset on a wall through the §2.1 panel attachment. */
export function addWallDecoration(
  project: InteriorProject,
  wallId: string,
  presetId: string,
  options?: { id?: string },
): InteriorProject {
  const preset = getWallDecorationPreset(presetId);
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!preset || !stored) return project;
  const wall = orientWallForRoom(project, project.activeRoomId, stored);
  return addWallPanel(project, wallId, {
    id: options?.id,
    catalogItemId: preset.catalogItemId,
    dimensions: preset.size(wall),
    floorOffsetMm: preset.floorOffsetMm,
  });
}
