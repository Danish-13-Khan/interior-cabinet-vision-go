import {
  clampCabinetProject,
  type CabinetConfig,
  type CabinetProject,
} from "../cabinetDimensions";
import { normalizeMultiRoomProject } from "../projectRooms";
import { DEFAULT_ROOM, type RoomConfig } from "../roomModel";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
import {
  INTERIOR_PROJECT_FILE_FORMAT,
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type InteriorProject,
  type InteriorProjectFile,
  type InteriorValidationIssue,
} from "./types";
import { validateInteriorProject } from "./validation";
import { migrateInteriorProjectDocument } from "./migrations";

type LegacyProjectFile = {
  project?: CabinetProject;
  config?: CabinetConfig;
  room?: RoomConfig;
};

export type InteriorProjectMigrationSource =
  | "interior-project-v2"
  | "cabinet-project-wrapper"
  | "single-cabinet-config";

export type LoadedInteriorProject = {
  document: InteriorProject;
  project: CabinetProject;
  room: RoomConfig;
  source: InteriorProjectMigrationSource;
  issues: InteriorValidationIssue[];
  migrationSteps: string[];
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseInput(input: string | unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw new Error("Project file is not valid JSON.");
  }
}

function isInteriorDocument(value: unknown) {
  const source = record(value);
  return Boolean(
    source &&
      source.units === "mm" &&
      Array.isArray(source.rooms) &&
      Array.isArray(source.walls) &&
      Array.isArray(source.objects),
  );
}

function singleCabinetProject(config: CabinetConfig): CabinetProject {
  return clampCabinetProject({
    version: 1,
    cabinets: [
      {
        id: "cabinet-1",
        name: "Cabinet 1",
        placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
        config,
        layerId: "layer-default",
        groupId: null,
      },
    ],
  });
}

export function createInteriorProjectFile(
  project: InteriorProject,
  savedAt = new Date().toISOString(),
): InteriorProjectFile {
  const safe = validateInteriorProject({ ...project, updatedAt: savedAt }).project;
  return {
    format: INTERIOR_PROJECT_FILE_FORMAT,
    schemaVersion: INTERIOR_PROJECT_SCHEMA_VERSION,
    savedAt,
    project: safe,
  };
}

export function serializeInteriorProjectFile(
  project: InteriorProject,
  savedAt = new Date().toISOString(),
) {
  return JSON.stringify(createInteriorProjectFile(project, savedAt), null, 2);
}

/** Load the canonical format or migrate either legacy cabinet-project shape. */
export function loadInteriorProjectFile(
  input: string | unknown,
  fallbackRoom: RoomConfig = DEFAULT_ROOM,
): LoadedInteriorProject {
  const parsed = parseInput(input);
  const root = record(parsed);
  if (!root) throw new Error("Project file root must be an object.");

  const wrappedProject = root.project;
  const canonical =
    root.format === INTERIOR_PROJECT_FILE_FORMAT && isInteriorDocument(wrappedProject)
      ? wrappedProject
      : isInteriorDocument(parsed)
        ? parsed
        : null;

  if (canonical) {
    const migration = migrateInteriorProjectDocument(canonical);
    const validation = validateInteriorProject(migration.document);
    const compatible = cabinetProjectFromInteriorProject(validation.project);
    return {
      document: validation.project,
      project: compatible.project,
      room: compatible.room,
      source: "interior-project-v2",
      issues: validation.issues,
      migrationSteps: migration.steps,
    };
  }

  const legacy = parsed as LegacyProjectFile;
  if (legacy.project && Array.isArray(legacy.project.cabinets)) {
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(legacy.project),
      legacy.room ?? fallbackRoom,
    );
    const room =
      safeProject.rooms?.find((item) => item.id === safeProject.activeRoomId)?.config ??
      legacy.room ??
      fallbackRoom;
    const document = interiorProjectFromCabinetProject({
      project: safeProject,
      activeRoom: room,
    });
    const compatible = cabinetProjectFromInteriorProject(document);
    return {
      document,
      project: compatible.project,
      room: compatible.room,
      source: "cabinet-project-wrapper",
      issues: [],
      migrationSteps: ["cabinet-project-to-interior-v1"],
    };
  }

  if (legacy.config) {
    const project = singleCabinetProject(legacy.config);
    const document = interiorProjectFromCabinetProject({
      project,
      activeRoom: fallbackRoom,
    });
    const compatible = cabinetProjectFromInteriorProject(document);
    return {
      document,
      project: compatible.project,
      room: compatible.room,
      source: "single-cabinet-config",
      issues: [],
      migrationSteps: ["single-cabinet-to-interior-v1"],
    };
  }

  throw new Error("Unsupported project file format.");
}
