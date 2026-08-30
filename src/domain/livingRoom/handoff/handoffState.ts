import type { CabinetProject } from "../../cabinetDimensions";
import type { InteriorProject } from "../../interiorProject";
import type { RevisionFingerprint } from "../../projectReview";
import { readProposalCommercial } from "../proposal/commercialState";
import {
  HANDOFF_EXTENSION,
  type EngineeringHandoffRecord,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readFingerprint(value: unknown): RevisionFingerprint | null {
  const record = asRecord(value);
  if (!record || typeof record.cabinetCount !== "number") return null;
  return {
    cabinetCount: record.cabinetCount,
    roomCount: typeof record.roomCount === "number" ? record.roomCount : 0,
    partLineCount: typeof record.partLineCount === "number" ? record.partLineCount : 0,
    workshopTotal: typeof record.workshopTotal === "number" ? record.workshopTotal : 0,
    sellTotal: typeof record.sellTotal === "number" ? record.sellTotal : 0,
    errorCount: typeof record.errorCount === "number" ? record.errorCount : 0,
    warningCount: typeof record.warningCount === "number" ? record.warningCount : 0,
    blockerCount: typeof record.blockerCount === "number" ? record.blockerCount : 0,
    cabinetNames: Array.isArray(record.cabinetNames)
      ? record.cabinetNames.filter((name): name is string => typeof name === "string")
      : [],
    materialKeys: Array.isArray(record.materialKeys)
      ? record.materialKeys.filter((key): key is string => typeof key === "string")
      : [],
  };
}

function parseRecord(value: unknown): EngineeringHandoffRecord | null {
  const raw = asRecord(value);
  if (!raw || typeof raw.handedOffAt !== "string" || typeof raw.revision !== "string") {
    return null;
  }
  const fingerprint = readFingerprint(raw.fingerprint);
  if (!fingerprint) return null;
  return {
    handedOffAt: raw.handedOffAt,
    revision: raw.revision,
    cabinetIds: Array.isArray(raw.cabinetIds)
      ? raw.cabinetIds.filter((id): id is string => typeof id === "string")
      : [],
    fingerprint,
    designFingerprint: typeof raw.designFingerprint === "string" ? raw.designFingerprint : "",
    selectedInteriorObjectIds: Array.isArray(raw.selectedInteriorObjectIds)
      ? raw.selectedInteriorObjectIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

function writeSnapshots(
  document: InteriorProject,
  snapshots: EngineeringHandoffRecord[],
): InteriorProject {
  return {
    ...document,
    extensions: {
      ...document.extensions,
      [HANDOFF_EXTENSION]: { snapshots },
    },
  };
}

export function readHandoffSnapshots(
  document: InteriorProject | null | undefined,
): EngineeringHandoffRecord[] {
  const raw = asRecord(document?.extensions?.[HANDOFF_EXTENSION]);
  if (!raw) return [];
  if (Array.isArray(raw.snapshots)) {
    return raw.snapshots.flatMap((item) => {
      const parsed = parseRecord(item);
      return parsed ? [parsed] : [];
    });
  }
  const legacy = parseRecord(raw);
  return legacy ? [legacy] : [];
}

export function hasHandoffSnapshotForRevision(
  document: InteriorProject,
  revision: string,
): boolean {
  return readHandoffSnapshots(document).some((item) => item.revision === revision);
}

export function readHandoffRecord(
  document: InteriorProject | null | undefined,
): EngineeringHandoffRecord | null {
  const snapshots = readHandoffSnapshots(document);
  if (!snapshots.length) return null;
  if (!document) return snapshots[0] ?? null;
  const revision = readProposalCommercial(document).job.revision;
  return snapshots.find((item) => item.revision === revision) ?? snapshots[0] ?? null;
}

export function writeHandoffRecord(
  document: InteriorProject,
  record: EngineeringHandoffRecord,
): InteriorProject {
  if (hasHandoffSnapshotForRevision(document, record.revision)) return document;
  return writeSnapshots(document, [record, ...readHandoffSnapshots(document)]);
}

export function readProjectHandoffRecord(
  project: CabinetProject,
): EngineeringHandoffRecord | null {
  const snapshots = readHandoffSnapshots(project.interiorDocument);
  if (!snapshots.length) return null;
  const revision = project.job?.revision
    ?? (project.interiorDocument
      ? readProposalCommercial(project.interiorDocument).job.revision
      : null);
  return (revision ? snapshots.find((item) => item.revision === revision) : null)
    ?? snapshots[0]
    ?? null;
}
