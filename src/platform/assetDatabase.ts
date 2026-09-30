const DB_NAME = "cabinet-designer-assets";
export const BLOB_STORE = "blobs";
export const DRAFT_STORE = "drafts";
export const SNAPSHOT_STORE = "snapshots";
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

export const ASSET_DB_BLOCKED = "Project storage is blocked by another tab. Close the other tab and reload.";

function ensureStores(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE);
  if (!db.objectStoreNames.contains(DRAFT_STORE)) db.createObjectStore(DRAFT_STORE);
  if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) db.createObjectStore(SNAPSHOT_STORE);
}

/**
 * Open the shared asset database. A blocked upgrade rejects instead of hanging,
 * and versionchange closes this connection so another tab can upgrade.
 */
export function openAssetDatabaseConnection(open: () => IDBOpenDBRequest): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = open();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Could not open model storage."));
      return;
    }
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error("Could not open model storage."));
    };
    request.onblocked = () => fail(new Error(ASSET_DB_BLOCKED));
    request.onerror = () => fail(request.error ?? new Error("Could not open model storage."));
    request.onupgradeneeded = () => ensureStores(request.result);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); };
      if (settled) {
        db.close();
        return;
      }
      settled = true;
      resolve(db);
    };
  });
}

/** Shared asset database. Version 3 adds project snapshots beside drafts and blobs. */
export function openAssetDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = openAssetDatabaseConnection(() => {
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is not available, so imported models cannot be stored.");
    }
    return indexedDB.open(DB_NAME, DB_VERSION);
  });
  const opening = dbPromise;
  // A connection closed by versionchange (or by the browser) must not stay cached, or every later write fails.
  const forget = () => { if (dbPromise === opening) dbPromise = null; };
  opening.then((db) => {
    db.addEventListener("versionchange", forget);
    db.addEventListener("close", forget);
  }, forget);
  return opening;
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
