import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "../cabinetDimensions";
import { DEFAULT_ROOM } from "../roomModel";
import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { createMemoryAssetBlobStore } from "../livingRoom/storedAssets";
import { interiorsSaveLabel } from "../desktopUx/interiorsChrome";
import { clearDraftPending, isDraftPending, markDraftPending } from "./pendingMarker";
import { loadSavedBrowser } from "./loadSavedBrowser";
import { createMemoryDraftStore } from "./types";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("close and reopen", () => {
  it("reopens the saved web draft, shows recovery once, then is clean", async () => {
    const id = defaultCabinetProject.interiorDocument?.id || "proj-1";
    const updatedAt = "2026-09-29T11:28:00.000Z";
    const storage = memoryStorage();
    storage.setItem(PROJECT_BROWSER_STORAGE_KEY, JSON.stringify([{ id, name: "Room", updatedAt, thumbnailKey: null }]));
    const drafts = createMemoryDraftStore();
    await drafts.put({
      id, document: { project: defaultCabinetProject, room: DEFAULT_ROOM }, dwgPreviews: {},
      updatedAt, schemaVersion: 2, lastFileSaveAt: updatedAt,
    });
    markDraftPending(storage, id);
    const first = await loadSavedBrowser({ storage, blobs: createMemoryAssetBlobStore(), drafts, openFilePath: null, platform: "web" });
    expect(first.ok).toBe(true);
    if (!first.ok || !first.recovery) throw new Error("expected a recovered draft");
    expect(first.recovery.decision).toMatchObject({ action: "open-draft" });
    expect(first.recovery.decision.action === "open-draft" && first.recovery.decision.notice).toContain("Recovered from autosave");
    clearDraftPending(storage, id);
    expect(isDraftPending(storage, id)).toBe(false);
    const again = await loadSavedBrowser({ storage, blobs: createMemoryAssetBlobStore(), drafts, openFilePath: null, platform: "web" });
    if (!again.ok || !again.recovery || again.recovery.decision.action !== "open-draft") throw new Error("expected a clean reopen");
    expect(again.recovery.decision.notice).toBeNull();
    expect(interiorsSaveLabel(false, "saved", updatedAt, Date.parse(updatedAt) + 5 * 60_000)).toBe("Saved · 5 minutes ago");
    expect(interiorsSaveLabel(true, "idle")).toBe("Unsaved changes");
  });
});
