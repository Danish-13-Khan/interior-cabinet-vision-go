import type { InteriorProject } from "../interiorProject/types";

export type FloorplanApplySnapshot = {
  wallIds: string[];
  openingIds: string[];
  roomIds: string[];
  objectCount: number;
};

export type ApplyImpactFinding = {
  code: string;
  message: string;
};

function readSnapshot(project: InteriorProject): FloorplanApplySnapshot | null {
  const raw = project.extensions?.floorplanApplySnapshot;
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.wallIds) || !Array.isArray(s.openingIds) || !Array.isArray(s.roomIds)) {
    return null;
  }
  return {
    wallIds: s.wallIds.map(String),
    openingIds: s.openingIds.map(String),
    roomIds: s.roomIds.map(String),
    objectCount: typeof s.objectCount === "number" ? s.objectCount : 0,
  };
}

function setEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((id) => sb.has(id));
}

/** What Apply will wipe / replace relative to the current InteriorProject. */
export function summarizeFloorplanApplyImpact(project: InteriorProject): ApplyImpactFinding[] {
  const findings: ApplyImpactFinding[] = [];
  const snap = readSnapshot(project);

  if (project.objects.length > 0) {
    findings.push({
      code: "objects",
      message: `${project.objects.length} placed object(s) will be removed`,
    });
  }
  if (project.surfaces.length > 0) {
    findings.push({
      code: "surfaces",
      message: `${project.surfaces.length} surface zone(s) will be cleared and rebuilt`,
    });
  }

  const wallIds = project.walls.map((w) => w.id);
  const openingIds = project.openings.map((o) => o.id);
  const roomIds = project.rooms.map((r) => r.id);

  if (!snap) {
    if (project.walls.length > 0) {
      findings.push({
        code: "walls",
        message: `${project.walls.length} existing wall(s) will be replaced by extract topology`,
      });
    }
    if (project.openings.length > 0) {
      findings.push({
        code: "openings",
        message: `${project.openings.length} existing opening(s) will be replaced`,
      });
    }
    if (project.rooms.length > 0) {
      findings.push({
        code: "rooms",
        message: `${project.rooms.length} existing room(s) will be replaced`,
      });
    }
    return findings;
  }

  if (!setEq(wallIds, snap.wallIds)) {
    findings.push({
      code: "walls_changed",
      message: "Walls were edited in Studio since the last floorplan Apply — they will be replaced",
    });
  }
  if (!setEq(openingIds, snap.openingIds)) {
    findings.push({
      code: "openings_changed",
      message: "Openings were edited in Studio since the last floorplan Apply — they will be replaced",
    });
  }
  if (!setEq(roomIds, snap.roomIds)) {
    findings.push({
      code: "rooms_changed",
      message: "Rooms were edited in Studio since the last floorplan Apply — they will be replaced",
    });
  }
  if (project.objects.length > snap.objectCount) {
    // already covered by objects finding when > 0
  }
  return findings;
}

export function buildFloorplanApplySnapshot(project: InteriorProject): FloorplanApplySnapshot {
  return {
    wallIds: project.walls.map((w) => w.id),
    openingIds: project.openings.map((o) => o.id),
    roomIds: project.rooms.map((r) => r.id),
    objectCount: project.objects.length,
  };
}
