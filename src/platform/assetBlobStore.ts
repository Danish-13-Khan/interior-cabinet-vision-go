import type { PrunableAssetBlobStore, StoredAssetEntry } from "../domain/livingRoom/storedAssets";

const DB_NAME = "cabinet-designer-assets";
const STORE_NAME = "blobs";

type StoredRecord = { blob: Blob; storedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available, so imported models cannot be stored."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open model storage."));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error ?? new Error("Model storage failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Model storage was aborted."));
  }));
}

function toRecord(value: unknown): StoredRecord | null {
  if (value instanceof Blob) return { blob: value, storedAt: 0 };
  const record = value as Partial<StoredRecord> | null;
  return record && record.blob instanceof Blob ? { blob: record.blob, storedAt: Number(record.storedAt) || 0 } : null;
}

export const indexedDbAssetBlobStore: PrunableAssetBlobStore = {
  get: async (key) => toRecord(await run<unknown>("readonly", (store) => store.get(key)))?.blob ?? null,
  put: async (key, blob) => {
    const record: StoredRecord = { blob, storedAt: Date.now() };
    await run("readwrite", (store) => store.put(record, key));
  },
  list: async () => {
    const entries: StoredAssetEntry[] = [];
    await run("readonly", (store) => {
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
    await run("readwrite", (store) => store.delete(key));
  },
};
