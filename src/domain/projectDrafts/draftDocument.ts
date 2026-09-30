import type { CabinetProject } from "../cabinetDimensions";
import type { InteriorProject } from "../interiorProject";
import type { RoomConfig } from "../roomModel";

export type DraftBody = { project: CabinetProject; room: RoomConfig };

export function isDraftBody(value: unknown): value is DraftBody {
  return Boolean(value) && typeof value === "object" && "project" in (value as object);
}

export function schemaVersionOf(project: CabinetProject): number {
  const version = project.interiorDocument?.schemaVersion;
  return typeof version === "number" ? version : 2;
}

export function projectIdOf(project: CabinetProject, fallback: string): string {
  return project.interiorDocument?.id || fallback;
}

export function interiorFromDraftBody(body: DraftBody): InteriorProject | null {
  return body.project.interiorDocument ?? null;
}
