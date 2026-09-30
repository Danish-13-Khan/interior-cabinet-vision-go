import type { SavedProjectBrowserEntry } from "../projectBrowserStorage";

export type WebDraftRestore = { entry: SavedProjectBrowserEntry; notice: string | null; filePath: string | null };

type Listener<T> = (value: T) => void;

function signal<T>(initial: T) {
  let current = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => current,
    set: (value: T) => { current = value; listeners.forEach((listener) => listener(current)); },
    subscribe: (listener: Listener<T>) => {
      listeners.add(listener);
      listener(current);
      return () => { listeners.delete(listener); };
    },
  };
}

export type RecoveryOffer = { prompt: string; entry: SavedProjectBrowserEntry; filePath: string | null } | null;
/** undefined means nobody has asked to change the open file path. */
export const projectFileAdoption = signal<string | null | undefined>(undefined);
export type AutosaveState = "idle" | "saving" | "saved" | "error";
export type AutosaveStatus = { state: AutosaveState; at: string | null };

export const browserLoading = signal(false);
export const recoveryOffer = signal<RecoveryOffer>(null);
export const webDraftRestore = signal<WebDraftRestore | null>(null);
export const autosaveStatus = signal<AutosaveStatus>({ state: "idle", at: null });

let flushImpl: (() => Promise<void>) | null = null;
let writesSuspended = false;

export function registerDraftFlush(flush: () => Promise<void>): () => void {
  flushImpl = flush;
  return () => { if (flushImpl === flush) flushImpl = null; };
}

export function flushDraftNow(): Promise<void> {
  return flushImpl?.() ?? Promise.resolve();
}

export function setDraftWritesSuspended(suspended: boolean): void {
  writesSuspended = suspended;
}

export function draftWritesSuspended(): boolean {
  return writesSuspended;
}

export function snapshotCaptureAllowed(): boolean {
  return !writesSuspended;
}

export function captureSnapshotIfAllowed(capture: () => void): void {
  if (snapshotCaptureAllowed()) capture();
}

let reloadImpl: ((projectId: string) => Promise<void>) | null = null;

export function registerDraftReload(reload: (projectId: string) => Promise<void>): () => void {
  reloadImpl = reload;
  return () => { if (reloadImpl === reload) reloadImpl = null; };
}

export function reloadDraftNow(projectId: string): Promise<void> {
  return reloadImpl?.(projectId) ?? Promise.resolve();
}

export function requestPersistentStorage(): void {
  const storage = typeof navigator !== "undefined" ? navigator.storage : undefined;
  if (storage?.persist) void storage.persist().catch(() => undefined);
}
