import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type InteriorProject,
  type RenderSettings,
} from "./types";

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  widthPx: 1920,
  heightPx: 1080,
  quality: "standard",
  exposure: 1,
  transparentBackground: false,
  activeCameraId: null,
  lightingRecipeId: "neutral-studio",
  composition: "architectural",
  packageCameraBookmarks: [],
};

export function createEmptyInteriorProject(options: {
  id?: string;
  name?: string;
  now?: string;
} = {}): InteriorProject {
  const now = options.now ?? new Date().toISOString();
  return {
    schemaVersion: INTERIOR_PROJECT_SCHEMA_VERSION,
    id: options.id ?? "interior-project",
    name: options.name?.trim() || "Interior Project",
    units: "mm",
    createdAt: now,
    updatedAt: now,
    activeRoomId: "",
    nodes: [],
    loops: [],
    rooms: [],
    walls: [],
    openings: [],
    surfaces: [],
    objects: [],
    materials: [],
    lights: [],
    cameras: [],
    renderSettings: { ...DEFAULT_RENDER_SETTINGS },
  };
}
