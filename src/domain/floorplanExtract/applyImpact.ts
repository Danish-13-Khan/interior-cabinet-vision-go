import type { InteriorProject } from "../interiorProject/types";
import {
  replacementImpactFingerprint,
  shellTopologyFingerprint,
} from "./applyImpactCanon";

export type FloorplanApplySnapshot = {
  wallIds: string[];
  openingIds: string[];
  roomIds: string[];
  objectCount: number;
  /** Deterministic fingerprint of shell topology + replaced wall/opening content. */
  shellFingerprint: string;
};

export type ApplyImpactFinding = {
  code: string;
  message: string;
};

export {
  shellTopologyFingerprint,
  discardedContentFingerprint,
  replacementImpactFingerprint,
} from "./applyImpactCanon";

type StoredApplySnapshot = {
  wallIds: string[];
  openingIds: string[];
  roomIds: string[];
  objectCount: number;
  shellFingerprint?: string;
};

function readSnapshot(project: InteriorProject): StoredApplySnapshot | null {
  const raw = project.extensions?.floorplanApplySnapshot;
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.wallIds) || !Array.isArray(s.openingIds) || !Array.isArray(s.roomIds)) {
    return null;
  }
  const out: StoredApplySnapshot = {
    wallIds: s.wallIds.map(String),
    openingIds: s.openingIds.map(String),
    roomIds: s.roomIds.map(String),
    objectCount: typeof s.objectCount === "number" ? s.objectCount : 0,
  };
  if (typeof s.shellFingerprint === "string") out.shellFingerprint = s.shellFingerprint;
  return out;
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
  const fp = shellTopologyFingerprint(project);

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

  if (!snap.shellFingerprint) {
    findings.push({
      code: "snapshot_legacy",
      message: "Prior Apply snapshot is ID-only — cannot verify geometry; re-Apply will replace the shell",
    });
  } else if (snap.shellFingerprint !== fp) {
    const idsSame =
      setEq(wallIds, snap.wallIds)
      && setEq(openingIds, snap.openingIds)
      && setEq(roomIds, snap.roomIds);
    findings.push({
      code: idsSame ? "shell_geometry_changed" : "shell_changed",
      message: idsSame
        ? "Shell geometry/content was edited in Studio (same IDs) — walls/openings/rooms/nodes/loops will be replaced"
        : "Shell topology was edited in Studio since the last floorplan Apply — it will be replaced",
    });
  }

  return findings;
}


export type FloorplanShellStaleReason = "diverged" | "legacy_snapshot";

export type FloorplanShellStaleState =
  | { stale: false }
  | { stale: true; reason: FloorplanShellStaleReason };

/**
 * Preview freshness vs last Apply snapshot.
 * ID-only snapshots (no shellFingerprint) are stale/unknown — same honesty as review's snapshot_legacy.
 */
export function floorplanShellStaleSinceApply(project: InteriorProject): FloorplanShellStaleState {
  const snap = readSnapshot(project);
  if (!snap) return { stale: false };
  if (!snap.shellFingerprint) return { stale: true, reason: "legacy_snapshot" };
  if (snap.shellFingerprint !== shellTopologyFingerprint(project)) {
    return { stale: true, reason: "diverged" };
  }
  return { stale: false };
}

/** True when Studio shell diverged, or Apply snapshot cannot verify geometry. */
export function isFloorplanShellStaleSinceApply(project: InteriorProject): boolean {
  return floorplanShellStaleSinceApply(project).stale;
}

export function buildFloorplanApplySnapshot(project: InteriorProject): FloorplanApplySnapshot {
  return {
    wallIds: project.walls.map((w) => w.id),
    openingIds: project.openings.map((o) => o.id),
    roomIds: project.rooms.map((r) => r.id),
    objectCount: project.objects.length,
    shellFingerprint: shellTopologyFingerprint(project),
  };
}

/**
 * Stable key for UI replace-ack — must change on further edits even when finding codes stay the same.
 * Binds to the full replacement-impact fingerprint (shell + objects/surfaces).
 */
export function applyImpactKey(project: InteriorProject, findings: ApplyImpactFinding[]): string {
  if (findings.length === 0) return "";
  return replacementImpactFingerprint(project);
}
