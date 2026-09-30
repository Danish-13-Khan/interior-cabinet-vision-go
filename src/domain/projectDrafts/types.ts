export const DRAFT_AUTOSAVE_MS = 1500;
export const DRAFT_PENDING_PREFIX = "cabinet-draft-pending:";

/** One working copy per project. `schemaVersion` is the interior document's existing field. */
export type ProjectDraft = {
  id: string;
  document: unknown;
  dwgPreviews: Record<string, unknown>;
  updatedAt: string;
  schemaVersion: number;
  lastFileSaveAt: string | null;
};

export type DraftStore = {
  get: (id: string) => Promise<ProjectDraft | null>;
  put: (draft: ProjectDraft) => Promise<void>;
  delete: (id: string) => Promise<void>;
  list: () => Promise<ProjectDraft[]>;
};

export type ProjectIndexEntry = {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailKey: string | null;
};

export function createMemoryDraftStore(): DraftStore & { size: () => number } {
  const drafts = new Map<string, ProjectDraft>();
  return {
    get: async (id) => drafts.get(id) ?? null,
    put: async (draft) => { drafts.set(draft.id, draft); },
    delete: async (id) => { drafts.delete(id); },
    list: async () => Array.from(drafts.values()),
    size: () => drafts.size,
  };
}
