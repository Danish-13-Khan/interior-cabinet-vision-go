import type { CabinetProject } from "../cabinetDimensions";
import type { RoomConfig } from "../roomModel";
import { schemaVersionOf } from "./draftDocument";
import { splitDwgPreviews } from "./dwgDraftSplit";
import type { DraftStore } from "./types";

/** "Save to browser" must write the draft the next load reads, not only the index. */
export async function persistBrowserProjectDraft(
  drafts: DraftStore,
  project: CabinetProject,
  room: RoomConfig,
  updatedAt: string,
): Promise<void> {
  const id = project.interiorDocument?.id;
  if (!id) return;
  const existing = await drafts.get(id);
  const split = splitDwgPreviews({ project, room });
  await drafts.put({
    id,
    document: split.document,
    dwgPreviews: split.dwgPreviews,
    updatedAt,
    schemaVersion: schemaVersionOf(project),
    lastFileSaveAt: existing?.lastFileSaveAt ?? null,
  });
}
