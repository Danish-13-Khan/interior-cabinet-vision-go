import type { InteriorProject } from "../interiorProject";
import type { JobStatus } from "../jobMeta";
import { readProposalCommercial } from "../livingRoom/proposal/commercialState";
import type { SavedProjectBrowserEntry } from "../projectBrowserStorage";
import { interiorsJobStatusLabel } from "./interiorsChrome";

export type InteriorsProjectStatusTone = "room" | "design" | "quoted" | "approved" | "sent";

export type InteriorsRecentProjectCard = {
  id: string;
  name: string;
  kindLabel: string;
  revision: string;
  statusLabel: string;
  statusTone: InteriorsProjectStatusTone;
  editedLabel: string;
};

export function interiorsProjectStatusTone(
  status: JobStatus,
  hasCabinets: boolean,
): InteriorsProjectStatusTone {
  if (status === "quoted") return "quoted";
  if (status === "approved") return "approved";
  if (status === "production") return "sent";
  return hasCabinets ? "design" : "room";
}

export function interiorsRelativeTime(iso: string, nowMs = Date.now()): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "Edited recently";
  const minutes = Math.max(0, Math.round((nowMs - then) / 60_000));
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "Edited 1 hour ago" : `Edited ${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Edited yesterday";
  return `Edited ${days} days ago`;
}

export function interiorsProjectKindLabel(document: InteriorProject): string {
  const room = document.rooms.find((item) => item.id === document.activeRoomId) ?? document.rooms[0];
  const roomName = room?.name.trim() || "Room";
  return document.objects.some((item) => item.kind === "cabinet") ? `${roomName} run` : roomName;
}

export function interiorsRecentProjectCard(
  entry: SavedProjectBrowserEntry,
  nowMs = Date.now(),
): InteriorsRecentProjectCard | null {
  const document = entry.project.interiorDocument;
  if (!document) return null;
  const hasCabinets = document.objects.some((item) => item.kind === "cabinet");
  const job = readProposalCommercial(document).job;
  return {
    id: entry.id,
    name: entry.name || document.name,
    kindLabel: interiorsProjectKindLabel(document),
    revision: job.revision || "A",
    statusLabel: interiorsJobStatusLabel(job.status, hasCabinets),
    statusTone: interiorsProjectStatusTone(job.status, hasCabinets),
    editedLabel: interiorsRelativeTime(entry.updatedAt || document.updatedAt, nowMs),
  };
}
