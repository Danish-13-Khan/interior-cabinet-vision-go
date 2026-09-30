import type { SnapshotReason } from "./types";

export const SNAPSHOT_REASON_LABELS: Record<SnapshotReason, string> = {
  interval: "Autosave",
  "room-closed": "Room closed",
  "first-cabinet": "First cabinet",
  render: "Render",
  "before-restore": "Before restore",
};

export type ProjectCounts = {
  rooms: number;
  walls: number;
  openings: number;
  cabinets: number;
  objects: number;
  importedModels: number;
};

export type ProjectOutline = ProjectCounts & { name: string; roomNames: Record<string, string> };

export type SnapshotComparison = { snapshot: ProjectOutline; current: ProjectOutline | null; changes: string[] };

type Named = { id?: unknown; name?: unknown; kind?: unknown; extensions?: { assetImport?: unknown } };

function list(value: unknown): Named[] {
  return Array.isArray(value) ? value.filter((item): item is Named => Boolean(item) && typeof item === "object") : [];
}

/** Counts read defensively: snapshots may predate the current schema. */
export function outlineProject(document: unknown): ProjectOutline {
  const record = (document && typeof document === "object" ? document : {}) as Record<string, unknown>;
  const rooms = list(record.rooms);
  const objects = list(record.objects);
  const cabinets = objects.filter((object) => object.kind === "cabinet").length;
  const roomNames: Record<string, string> = {};
  for (const room of rooms) {
    if (typeof room.id === "string") roomNames[room.id] = typeof room.name === "string" ? room.name : "";
  }
  return {
    name: typeof record.name === "string" && record.name.trim() ? record.name : "Untitled project",
    roomNames,
    rooms: rooms.length,
    walls: list(record.walls).length,
    openings: list(record.openings).length,
    cabinets,
    objects: objects.length - cabinets,
    importedModels: objects.filter((object) => Boolean(object.extensions?.assetImport)).length,
  };
}

const NOUNS: Record<keyof ProjectCounts, [string, string]> = {
  rooms: ["room", "rooms"],
  walls: ["wall", "walls"],
  openings: ["opening", "openings"],
  cabinets: ["cabinet", "cabinets"],
  objects: ["object", "objects"],
  importedModels: ["imported model", "imported models"],
};

export function countLabel(count: number, key: keyof ProjectCounts): string {
  return `${count} ${NOUNS[key][count === 1 ? 0 : 1]}`;
}

/** What this version has compared with the open project, e.g. "+2 cabinets", "−1 object", "room renamed". */
export function describeSnapshotChanges(snapshot: ProjectOutline, current: ProjectOutline): string[] {
  const changes: string[] = [];
  if (snapshot.name !== current.name) changes.push(`project named “${snapshot.name}”`);
  for (const key of Object.keys(NOUNS) as (keyof ProjectCounts)[]) {
    const delta = snapshot[key] - current[key];
    if (delta === 0) continue;
    const sign = delta > 0 ? "+" : "−";
    changes.push(`${sign}${countLabel(Math.abs(delta), key)}`);
  }
  const renamed = Object.entries(snapshot.roomNames)
    .filter(([id, name]) => id in current.roomNames && current.roomNames[id] !== name).length;
  if (renamed === 1) changes.push("room renamed");
  else if (renamed > 1) changes.push(`${renamed} rooms renamed`);
  return changes;
}

export function compareSnapshot(snapshotDocument: unknown, currentDocument: unknown): SnapshotComparison {
  const snapshot = outlineProject(snapshotDocument);
  const current = currentDocument && typeof currentDocument === "object" ? outlineProject(currentDocument) : null;
  return { snapshot, current, changes: current ? describeSnapshotChanges(snapshot, current) : [] };
}
