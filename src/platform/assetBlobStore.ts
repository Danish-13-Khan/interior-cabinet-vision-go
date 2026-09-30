import type { PrunableAssetBlobStore, StoredAssetEntry } from "../domain/livingRoom/storedAssets";
import { BLOB_STORE, runStore } from "./assetDatabase";

type StoredRecord = { blob: Blob; storedAt: number };

function toRecord(value: unknown): StoredRecord | null {
  if (value instanceof Blob) return { blob: value, storedAt: 0 };
  const record = value as Partial<StoredRecord> | null;
  return record && record.blob instanceof Blob ? { blob: record.blob, storedAt: Number(record.storedAt) || 0 } : null;
}

export const indexedDbAssetBlobStore: PrunableAssetBlobStore = {
  get: async (key) => toRecord(await runStore<unknown>(BLOB_STORE, "readonly", (store) => store.get(key)))?.blob ?? null,
  put: async (key, blob) => {
    const record: StoredRecord = { blob, storedAt: Date.now() };
    await runStore(BLOB_STORE, "readwrite", (store) => store.put(record, key));
  },
  list: async () => {
    const entries: StoredAssetEntry[] = [];
    await runStore(BLOB_STORE, "readonly", (store) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        entries.push({ key: String(cursor.key), storedAt: toRecord(cursor.value)?.storedAt ?? 0 });
        cursor.continue();
      };
      return request;
    });
    return entries;
  },
  delete: async (key) => {
    await runStore(BLOB_STORE, "readwrite", (store) => store.delete(key));
  },
};
