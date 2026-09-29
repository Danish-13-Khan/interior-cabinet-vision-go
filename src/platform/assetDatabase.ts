const DB_NAME = "cabinet-designer-assets";
export const BLOB_STORE = "blobs";
export const DRAFT_STORE = "drafts";
export const SNAPSHOT_STORE = "snapshots";
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

/** Shared asset database. Version 3 adds project snapshots beside drafts and blobs. */
export function openAssetDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available, so imported models cannot be stored."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE);
      if (!db.objectStoreNames.contains(DRAFT_STORE)) db.createObjectStore(DRAFT_STORE);
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) db.createObjectStore(SNAPSHOT_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open model storage."));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

export function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openAssetDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error ?? new Error("Model storage failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Model storage was aborted."));
  }));
}
