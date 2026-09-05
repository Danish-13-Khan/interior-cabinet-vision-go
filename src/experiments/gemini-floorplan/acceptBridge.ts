import { serializeInteriorProjectFile } from "../../domain/interiorProject";
import type { InteriorProject } from "../../domain/interiorProject/types";

export const LAB_ACCEPT_STORAGE_KEY = "gemini-floorplan-lab:accepted-interior-v1";

export type AcceptSummary = {
  projectId: string;
  projectName: string;
  roomCount: number;
  wallCount: number;
  roomNames: string[];
  acceptedAt: string;
};

export function summarizeAcceptedProject(project: InteriorProject): AcceptSummary {
  return {
    projectId: project.id,
    projectName: project.name,
    roomCount: project.rooms.length,
    wallCount: project.walls.length,
    roomNames: project.rooms.map((r) => r.name),
    acceptedAt: project.updatedAt,
  };
}

/** Stash accepted draft for a later handoff into /app (session only). */
export function stashAcceptedInteriorProject(project: InteriorProject): void {
  const payload = serializeInteriorProjectFile(project);
  sessionStorage.setItem(LAB_ACCEPT_STORAGE_KEY, payload);
}

export function readStashedAcceptedInteriorFile(): string | null {
  return sessionStorage.getItem(LAB_ACCEPT_STORAGE_KEY);
}

export function clearStashedAcceptedInterior(): void {
  sessionStorage.removeItem(LAB_ACCEPT_STORAGE_KEY);
}

export function downloadInteriorProjectFile(project: InteriorProject, filename?: string): void {
  const text = serializeInteriorProjectFile(project);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${project.id}.interior.json`;
  a.click();
  URL.revokeObjectURL(url);
}
