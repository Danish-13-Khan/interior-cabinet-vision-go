import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject";
import { LIVING_ROOM_RECOVERY_STORAGE_KEY } from "../livingRoom/desktopExperience";
import { createMemoryAssetBlobStore, pruneStoredAssets, STORED_ASSET_PRUNE_GRACE_MS } from "../livingRoom/storedAssets";
import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { DEFAULT_ROOM } from "../roomModel";
import { pruneIfSnapshotsLoaded } from "./assetCleanup";
import { recoveryOffer } from "./browserSignals";
import { persistBrowserProjectDraft } from "./browserDraftSave";
import { loadSavedBrowser, offerDesktopFileRecovery } from "./loadSavedBrowser";
import { isDraftBody } from "./draftDocument";
import { reloadSavedDraft } from "./hydrateBrowserEntries";
import { migrateBrowserDrafts } from "./migrateBrowserDrafts";
import { chooseRecoveryProject, readProjectFileBindings, rememberProjectFileBinding } from "./projectFileBinding";
import { projectThumbnailStorageKey, storeProjectThumbnail, thumbnailKeepValues } from "./projectThumbnail";
import { persistSharedProjectIndex } from "./sharedProjectIndex";
import { createMemoryDraftStore, type DraftStore, type ProjectIndexEntry } from "./types";
import { seedOpenedDraft } from "../../platform/cabinetArchive/seedDraft";

function memoryStorage(initial?: Record<string, string>) {
  const values = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const project = () => createEmptyInteriorProject({ id: "proj-recover", name: "Kitchen" });

describe("recovery copy is removed only after IndexedDB accepts it", () => {
  it("keeps the localStorage recovery copy when the draft write throws", async () => {
    const raw = JSON.stringify({ savedAt: "2026-09-29T00:00:00.000Z", project: project() });
    const storage = memoryStorage({ [LIVING_ROOM_RECOVERY_STORAGE_KEY]: raw });
    const drafts: DraftStore = {
      get: async () => null,
      put: async () => { throw new Error("IndexedDB write failed"); },
      delete: async () => undefined,
      list: async () => [],
    };
    await expect(migrateBrowserDrafts({ storage, blobs: createMemoryAssetBlobStore(), drafts })).rejects.toThrow(/IndexedDB/);
    expect(storage.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY)).toBe(raw);
  });

  it("removes the recovery copy after the draft is stored", async () => {
    const raw = JSON.stringify({ savedAt: "2026-09-29T00:00:00.000Z", project: project() });
    const storage = memoryStorage({ [LIVING_ROOM_RECOVERY_STORAGE_KEY]: raw });
    const drafts = createMemoryDraftStore();
    await migrateBrowserDrafts({ storage, blobs: createMemoryAssetBlobStore(), drafts });
    expect(storage.getItem(LIVING_ROOM_RECOVERY_STORAGE_KEY)).toBeNull();
    expect(await drafts.get("proj-recover")).toBeTruthy();
  });
});

describe("opened cabinet drafts", () => {
  it("stores the reader shape and does not clobber a newer unsaved draft", async () => {
    const drafts = createMemoryDraftStore();
    const opened = createEmptyInteriorProject({ id: "proj-open", name: "Opened", now: "2026-09-01T00:00:00.000Z" });
    await seedOpenedDraft(opened, drafts, "2026-09-30T00:00:00.000Z");
    const seeded = await drafts.get("proj-open");
    expect(isDraftBody(seeded?.document)).toBe(true);
    expect(await reloadSavedDraft("proj-open", drafts, () => undefined)).toBe(true);
    const newer = {
      id: "proj-open",
      document: { project: { marker: "newer", interiorDocument: { id: "proj-open" } }, room: DEFAULT_ROOM },
      dwgPreviews: {},
      updatedAt: "2026-09-15T00:00:00.000Z",
      schemaVersion: 2,
      lastFileSaveAt: "2026-09-01T00:00:00.000Z",
    };
    await drafts.put(newer);
    await seedOpenedDraft(opened, drafts, "2026-09-30T00:00:00.000Z");
    expect((await drafts.get("proj-open"))?.updatedAt).toBe("2026-09-15T00:00:00.000Z");
  });
});

describe("project index is not wiped or cross-clobbered", () => {
  it("does not write when startup failed, and keeps entries whose drafts are missing", () => {
    const kept: ProjectIndexEntry = { id: "missing", name: "Kept", updatedAt: "2026-09-02T00:00:00.000Z", thumbnailKey: null };
    const storage = memoryStorage({ [PROJECT_BROWSER_STORAGE_KEY]: JSON.stringify([kept]) });
    expect(persistSharedProjectIndex(storage, [], new Set(), false)).toBe("skipped");
    expect(storage.getItem(PROJECT_BROWSER_STORAGE_KEY)).toContain("missing");
    expect(persistSharedProjectIndex(storage, [], new Set(), true)).toBe("saved");
    expect(storage.getItem(PROJECT_BROWSER_STORAGE_KEY)).toContain("missing");
  });

  it("does not let a stale tab list drop another tab's newer project", () => {
    const stored = [
      { id: "a", name: "Old A", updatedAt: "2026-09-02T00:00:00.000Z", thumbnailKey: null },
      { id: "b", name: "From other tab", updatedAt: "2026-09-03T00:00:00.000Z", thumbnailKey: "idb:thumbnail:b" },
    ];
    const storage = memoryStorage({ [PROJECT_BROWSER_STORAGE_KEY]: JSON.stringify(stored) });
    const visible = [{ id: "a", name: "Old A", updatedAt: "2026-09-01T00:00:00.000Z", thumbnailKey: null }];
    persistSharedProjectIndex(storage, visible, new Set(), true);
    const saved = JSON.parse(storage.getItem(PROJECT_BROWSER_STORAGE_KEY) ?? "[]") as ProjectIndexEntry[];
    expect(saved.map((entry) => entry.id).sort()).toEqual(["a", "b"]);
    expect(saved.find((entry) => entry.id === "a")?.updatedAt).toBe("2026-09-02T00:00:00.000Z");
  });
});

describe("desktop recovery uses the open file's own project", () => {
  it("does not compare project B's draft with project A's file", () => {
    const storage = memoryStorage();
    rememberProjectFileBinding(storage, "proj-a", "/tmp/a.cabinet");
    const choice = chooseRecoveryProject({
      entries: [
        { id: "proj-a", updatedAt: "2026-09-01T00:00:00.000Z" },
        { id: "proj-b", updatedAt: "2026-09-20T00:00:00.000Z" },
      ],
      openFilePath: "/tmp/a.cabinet",
      bindings: readProjectFileBindings(storage),
    });
    expect(choice).toEqual({ projectId: "proj-a", filePath: "/tmp/a.cabinet" });
    expect(chooseRecoveryProject({
      entries: [{ id: "proj-b", updatedAt: "2026-09-20T00:00:00.000Z" }],
      openFilePath: "/tmp/a.cabinet",
      bindings: {},
    })).toBeNull();
    expect(rememberProjectFileBinding(storage, "proj-a", "version")).toBeUndefined();
    expect(readProjectFileBindings(storage)["proj-a"]).toBe("/tmp/a.cabinet");
  });

  it("does not restore a newer project onto the open desktop file", async () => {
    const drafts = createMemoryDraftStore();
    const blobs = createMemoryAssetBlobStore();
    await seedOpenedDraft(createEmptyInteriorProject({ id: "proj-a", name: "A", now: "2026-09-10T00:00:00.000Z" }), drafts, "2026-09-01T00:00:00.000Z");
    await seedOpenedDraft(createEmptyInteriorProject({ id: "proj-b", name: "B", now: "2026-09-20T00:00:00.000Z" }), drafts, "2026-09-01T00:00:00.000Z");
    const storage = memoryStorage({
      [PROJECT_BROWSER_STORAGE_KEY]: JSON.stringify([
        { id: "proj-a", name: "A", updatedAt: "2026-09-10T00:00:00.000Z", thumbnailKey: null },
        { id: "proj-b", name: "B", updatedAt: "2026-09-20T00:00:00.000Z", thumbnailKey: null },
      ]),
    });
    const loaded = await loadSavedBrowser({ storage, blobs, drafts, openFilePath: "/tmp/a.cabinet", platform: "desktop" });
    expect(loaded.ok && loaded.recovery).toBeNull();
    recoveryOffer.set(null);
    await offerDesktopFileRecovery({ storage, blobs, drafts, projectId: "proj-a", filePath: "/tmp/a.cabinet" });
    expect(recoveryOffer.get()).toMatchObject({ filePath: "/tmp/a.cabinet", entry: { id: "proj-a" } });
    recoveryOffer.set(null);
  });
});

describe("browser save writes a draft and thumbnails do not leak", () => {
  it("persists a readable draft and replaces the thumbnail blob in place", async () => {
    const drafts = createMemoryDraftStore();
    const interior = createEmptyInteriorProject({ id: "proj-save", name: "Saved" });
    const opened = await seedOpenedDraft(interior, drafts, "2026-09-01T00:00:00.000Z").then(() => drafts.get("proj-save"));
    const body = opened?.document as { project: import("../cabinetDimensions").CabinetProject; room: typeof DEFAULT_ROOM };
    await persistBrowserProjectDraft(drafts, body.project, body.room, "2026-09-04T00:00:00.000Z");
    expect(isDraftBody((await drafts.get("proj-save"))?.document)).toBe(true);
    const blobs = createMemoryAssetBlobStore(() => 0);
    await storeProjectThumbnail(blobs, "proj-save", new Blob(["one"]));
    await storeProjectThumbnail(blobs, "proj-save", new Blob(["two"]));
    expect(blobs.size()).toBe(1);
    const ref = `idb:${projectThumbnailStorageKey("proj-save")}`;
    const removed = await pruneStoredAssets(blobs, thumbnailKeepValues([ref]), { now: STORED_ASSET_PRUNE_GRACE_MS + 1 });
    expect(removed).toBe(0);
  });

  it("does not prune when the snapshot list failed to load", async () => {
    let pruned = false;
    const ran = await pruneIfSnapshotsLoaded({
      listSnapshots: async () => { throw new Error("snapshots unavailable"); },
      listDrafts: async () => [],
      current: null,
      thumbnailRefs: ["idb:thumbnail:proj-save"],
      prune: async () => { pruned = true; },
    });
    expect(ran).toBe(false);
    expect(pruned).toBe(false);
  });
});
