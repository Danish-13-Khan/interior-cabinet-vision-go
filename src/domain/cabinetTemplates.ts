import {
  clampCabinetConfig,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetType,
} from "./cabinetDimensions";
import {
  applyStandardsToConfig,
  createConfigFromLibraryItem,
} from "./cabinetLibraryCatalog";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
  type ProjectStandards,
} from "./projectStandards";
import type { RoomConfig } from "./roomModel";
import { DEFAULT_ROOM } from "./roomModel";
import type { CabinetProject } from "./cabinetDimensions";

export const CABINET_TEMPLATES_STORAGE_KEY = "cabinet-designer-cabinet-templates";

export type CabinetTemplate = {
  id: string;
  name: string;
  family: CabinetType;
  description: string;
  config: CabinetConfig;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export function clampCabinetTemplate(
  template: Partial<CabinetTemplate> & Pick<CabinetTemplate, "id" | "name" | "family" | "config">,
): CabinetTemplate {
  const now = new Date().toISOString();
  return {
    id: template.id,
    name: template.name.trim() || `${template.family} template`,
    family: template.family,
    description: template.description?.trim() || "User cabinet template",
    config: clampCabinetConfig(template.config),
    version: Math.max(1, Math.round(Number(template.version) || 1)),
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  };
}

export function createTemplateFromCabinet(
  cabinet: CabinetInstance,
  name?: string,
): CabinetTemplate {
  const now = new Date().toISOString();
  return clampCabinetTemplate({
    id: `template-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name?.trim() || `${cabinet.name} Template`,
    family: cabinet.config.type,
    description: `Saved from ${cabinet.name}`,
    config: clampCabinetConfig(cabinet.config),
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
}

export function createConfigFromTemplate(
  template: CabinetTemplate,
  standards?: ProjectStandards,
): CabinetConfig {
  const config = clampCabinetConfig(template.config);
  return standards
    ? applyStandardsToConfig(config, clampProjectStandards(standards))
    : config;
}

export function loadUserTemplatesFromStorage(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
): CabinetTemplate[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CABINET_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CabinetTemplate[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.id && item.config && item.family)
      .map((item) => clampCabinetTemplate(item));
  } catch {
    return [];
  }
}

export function saveUserTemplatesToStorage(
  templates: CabinetTemplate[],
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
) {
  if (!storage) return;
  storage.setItem(CABINET_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

export function upsertUserTemplate(
  templates: CabinetTemplate[],
  template: CabinetTemplate,
): CabinetTemplate[] {
  const existing = templates.find((item) => item.id === template.id);
  const nextTemplate = clampCabinetTemplate({
    ...template,
    createdAt: existing?.createdAt ?? template.createdAt,
    version: existing ? existing.version + 1 : Math.max(1, template.version ?? 1),
    updatedAt: new Date().toISOString(),
  });
  const next = templates.filter((item) => item.id !== nextTemplate.id);
  return [...next, nextTemplate].sort((a, b) => a.name.localeCompare(b.name));
}

export function removeUserTemplate(
  templates: CabinetTemplate[],
  templateId: string,
): CabinetTemplate[] {
  return templates.filter((item) => item.id !== templateId);
}

export type ProjectStarterTemplate = {
  id: string;
  label: string;
  description: string;
};

export const PROJECT_STARTER_TEMPLATES: ProjectStarterTemplate[] = [
  {
    id: "kitchen-base-run",
    label: "Kitchen Base Run",
    description: "Starter back-wall base run with drawer and sink cabinets.",
  },
  {
    id: "kitchen-wall-pack",
    label: "Kitchen Wall Pack",
    description: "Starter wall cabinets above a short base run.",
  },
];

export function createProjectFromStarter(
  starterId: string,
  standards: ProjectStandards = DEFAULT_PROJECT_STANDARDS,
): { project: CabinetProject; room: RoomConfig } | null {
  const safeStandards = clampProjectStandards(standards);
  const room: RoomConfig = {
    ...DEFAULT_ROOM,
    dimensions: { ...DEFAULT_ROOM.dimensions },
    doors: [...DEFAULT_ROOM.doors],
    windows: [...DEFAULT_ROOM.windows],
  };

  function itemConfig(libraryId: string): CabinetConfig {
    return (
      createConfigFromLibraryItem(libraryId, safeStandards) ??
      applyStandardsToConfig(
        clampCabinetConfig({
          type: "base",
          dimensions: { width: 900, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
          shelfCount: 1,
          hasDoors: true,
          toeKickHeight: 100,
          toeKickInset: 60,
        }),
        safeStandards,
      )
    );
  }

  if (starterId === "kitchen-base-run") {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        {
          id: "starter-base-1",
          name: "Base Double",
          placement: { x: -900, y: 0, z: -1720, rotation: 0, attachment: "floor" },
          config: itemConfig("engineered-base-900-double-door"),
          layerId: "layer-default",
          groupId: null,
        },
        {
          id: "starter-drawer-1",
          name: "Drawer Stack",
          placement: { x: 0, y: 0, z: -1720, rotation: 0, attachment: "floor" },
          config: itemConfig("engineered-base-600-drawer-stack"),
          layerId: "layer-default",
          groupId: null,
        },
        {
          id: "starter-sink-1",
          name: "Sink Base",
          placement: { x: 950, y: 0, z: -1720, rotation: 0, attachment: "floor" },
          config: itemConfig("engineered-sink-900"),
          layerId: "layer-default",
          groupId: null,
        },
      ],
      layers: [
        { id: "layer-default", name: "Default Layer", visible: true, locked: false },
      ],
      groups: [],
      preferences: {
        snapSizeMm: 50,
        showGrid: true,
        autoSaveToBrowser: true,
        standards: safeStandards,
      },
    };
    return { project, room };
  }

  if (starterId === "kitchen-wall-pack") {
    const project: CabinetProject = {
      version: 1,
      cabinets: [
        {
          id: "starter-base-wall-1",
          name: "Base Cabinet",
          placement: { x: -450, y: 0, z: -1720, rotation: 0, attachment: "floor" },
          config: itemConfig("engineered-base-900-single-door"),
          layerId: "layer-default",
          groupId: null,
        },
        {
          id: "starter-wall-1",
          name: "Wall Double",
          placement: { x: -450, y: 1400, z: -1840, rotation: 0, attachment: "back-wall" },
          config: itemConfig("engineered-wall-900-double"),
          layerId: "layer-default",
          groupId: null,
        },
        {
          id: "starter-wall-open",
          name: "Wall Open",
          placement: { x: 500, y: 1400, z: -1840, rotation: 0, attachment: "back-wall" },
          config: itemConfig("engineered-wall-600-open"),
          layerId: "layer-default",
          groupId: null,
        },
      ],
      layers: [
        { id: "layer-default", name: "Default Layer", visible: true, locked: false },
      ],
      groups: [],
      preferences: {
        snapSizeMm: 50,
        showGrid: true,
        autoSaveToBrowser: true,
        standards: safeStandards,
      },
    };
    return { project, room };
  }

  return null;
}
