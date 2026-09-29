import type { AssetBlobStore } from "../domain/livingRoom/storedAssets";

const DB_NAME = "cabinet-designer-assets";
const STORE_NAME = "blobs";

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

export const indexedDbAssetBlobStore: AssetBlobStore = {
  get: async (key) => {
    const value = await run<unknown>("readonly", (store) => store.get(key));
    return value instanceof Blob ? value : null;
  },
  put: async (key, blob) => {
    await run("readwrite", (store) => store.put(blob, key));
  },
};
