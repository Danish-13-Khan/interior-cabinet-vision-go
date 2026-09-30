import { describe, expect, it } from "vitest";
import { ASSET_DB_BLOCKED, openAssetDatabaseConnection } from "./assetDatabase";

function fakeRequest() {
  const db = {
    closed: false,
    close() { this.closed = true; },
    onversionchange: null as (() => void) | null,
    objectStoreNames: { contains: () => true },
    createObjectStore() { return undefined; },
  };
  return {
    db,
    request: {
      error: null,
      result: db,
      onblocked: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onupgradeneeded: null as (() => void) | null,
    },
  };
}

describe("asset database startup", () => {
  it("rejects when an older tab blocks the upgrade instead of hanging", async () => {
    const { request } = fakeRequest();
    const opening = openAssetDatabaseConnection(() => request as unknown as IDBOpenDBRequest);
    request.onblocked?.();
    await expect(opening).rejects.toThrow(ASSET_DB_BLOCKED);
  });

  it("closes this connection when another tab needs a version change", async () => {
    const { db, request } = fakeRequest();
    const opening = openAssetDatabaseConnection(() => request as unknown as IDBOpenDBRequest);
    request.onsuccess?.();
    await opening;
    db.onversionchange?.();
    expect(db.closed).toBe(true);
  });
});
