import type { CabinetProject } from "../domain/cabinetDimensions";
import {
  interiorProjectFromCabinetProject,
  loadInteriorProjectFile,
  validateInteriorProject,
  type InteriorProject,
} from "../domain/interiorProject";
import type { RoomConfig } from "../domain/roomModel";

export function snapshotFromParsedFile(
  parsed: unknown,
  fallbackRoom: RoomConfig,
): { document: InteriorProject; project: CabinetProject; room: RoomConfig } {
  const loaded = loadInteriorProjectFile(parsed, fallbackRoom);
  return { document: loaded.document, project: loaded.project, room: loaded.room };
}

export function currentInteriorDocument(project: CabinetProject, room: RoomConfig) {
  if (project.interiorDocument) return validateInteriorProject(project.interiorDocument).project;
  return interiorProjectFromCabinetProject({ project, activeRoom: room });
}

export function persistenceFingerprint(document: InteriorProject) {
  return JSON.stringify({ ...document, updatedAt: "" });
}
