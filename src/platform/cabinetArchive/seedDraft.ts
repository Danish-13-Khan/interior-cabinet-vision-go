import type { CabinetProject } from "../../domain/cabinetDimensions";
import { cabinetProjectFromInteriorProject, loadInteriorProjectFile, validateInteriorProject } from "../../domain/interiorProject";
import type { RoomConfig } from "../../domain/roomModel";
import { splitDwgPreviews } from "../../domain/projectDrafts/dwgDraftSplit";
import { isDraftBody, schemaVersionOf } from "../../domain/projectDrafts/draftDocument";
import type { DraftStore, ProjectDraft } from "../../domain/projectDrafts/types";

/** Keep a newer unsaved draft. The file's own updatedAt is the comparison, not "now". */
export function shouldReplaceOpenedDraft(existingUpdatedAt: string | null, fileUpdatedAt: string | null): boolean {
  if (!existingUpdatedAt) return true;
  if (!fileUpdatedAt) return false;
  const draftTime = Date.parse(existingUpdatedAt);
  const fileTime = Date.parse(fileUpdatedAt);
  if (Number.isNaN(draftTime) || Number.isNaN(fileTime)) return false;
  return fileTime >= draftTime;
}

function fileUpdatedAt(document: unknown): string | null {
  if (!document || typeof document !== "object") return null;
  const value = (document as { updatedAt?: unknown }).updatedAt;
  return typeof value === "string" && value ? value : null;
}

function openedBody(document: unknown): { id: string; project: CabinetProject; room: RoomConfig } | null {
  try {
    const loaded = loadInteriorProjectFile(document);
    return { id: loaded.document.id, project: loaded.project, room: loaded.room };
  } catch {
    const repaired = validateInteriorProject(document).project;
    if (!repaired.id) return null;
    const compatible = cabinetProjectFromInteriorProject(repaired);
    return { id: repaired.id, project: compatible.project, room: compatible.room };
  }
}

/** The draft reader expects `{ project, room }`, not the raw interior document. */
export function openedDraftRecord(document: unknown, savedAt: string): ProjectDraft | null {
  const opened = openedBody(document);
  if (!opened) return null;
  const body = { project: opened.project, room: opened.room };
  if (!isDraftBody(body) || !opened.id) return null;
  const split = splitDwgPreviews(body);
  return {
    id: opened.id,
    document: split.document,
    dwgPreviews: split.dwgPreviews,
    updatedAt: fileUpdatedAt(document) ?? savedAt,
    schemaVersion: schemaVersionOf(body.project),
    lastFileSaveAt: savedAt,
  };
}

/** Opening a file is the saved draft, not a second autosave store. */
export async function seedOpenedDraft(document: unknown, drafts: DraftStore, savedAt = new Date().toISOString()): Promise<void> {
  const existingId = document && typeof document === "object" && typeof (document as { id?: unknown }).id === "string"
    ? (document as { id: string }).id
    : "";
  const existing = existingId ? await drafts.get(existingId) : null;
  if (!shouldReplaceOpenedDraft(existing?.updatedAt ?? null, fileUpdatedAt(document))) return;
  const draft = openedDraftRecord(document, savedAt);
  if (draft) await drafts.put(draft);
}
