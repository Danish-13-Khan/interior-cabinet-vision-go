import { splitDwgPreviews } from "../../domain/projectDrafts/dwgDraftSplit";
import type { DraftStore, ProjectDraft } from "../../domain/projectDrafts/types";

function draftFrom(document: unknown, savedAt: string): ProjectDraft | null {
  if (!document || typeof document !== "object") return null;
  const record = document as { id?: unknown; schemaVersion?: unknown; updatedAt?: unknown };
  if (typeof record.id !== "string" || !record.id) return null;
  const split = splitDwgPreviews(document);
  return {
    id: record.id,
    document: split.document,
    dwgPreviews: split.dwgPreviews,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : savedAt,
    schemaVersion: typeof record.schemaVersion === "number" ? record.schemaVersion : 2,
    lastFileSaveAt: savedAt,
  };
}

/** Opening a file is the saved draft, not a second autosave store. */
export async function seedOpenedDraft(document: unknown, drafts: DraftStore, savedAt = new Date().toISOString()): Promise<void> {
  const draft = draftFrom(document, savedAt);
  if (draft) await drafts.put(draft);
}
