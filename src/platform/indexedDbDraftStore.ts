import type { DraftStore, ProjectDraft } from "../domain/projectDrafts/types";
import { DRAFT_STORE, runStore } from "./assetDatabase";

function asDraft(value: unknown): ProjectDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<ProjectDraft>;
  if (typeof draft.id !== "string" || typeof draft.updatedAt !== "string") return null;
  return {
    id: draft.id,
    document: draft.document ?? null,
    dwgPreviews: draft.dwgPreviews && typeof draft.dwgPreviews === "object" ? draft.dwgPreviews : {},
    updatedAt: draft.updatedAt,
    schemaVersion: typeof draft.schemaVersion === "number" ? draft.schemaVersion : 2,
    lastFileSaveAt: typeof draft.lastFileSaveAt === "string" ? draft.lastFileSaveAt : null,
  };
}

export const indexedDbDraftStore: DraftStore = {
  get: async (id) => asDraft(await runStore<unknown>(DRAFT_STORE, "readonly", (store) => store.get(id))),
  put: async (draft) => {
    await runStore(DRAFT_STORE, "readwrite", (store) => store.put(draft, draft.id));
  },
  delete: async (id) => {
    await runStore(DRAFT_STORE, "readwrite", (store) => store.delete(id));
  },
  list: async () => {
    const drafts: ProjectDraft[] = [];
    await runStore(DRAFT_STORE, "readonly", (store) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const draft = asDraft(cursor.value);
        if (draft) drafts.push(draft);
        cursor.continue();
      };
      return request;
    });
    return drafts;
  },
};
