import { useEffect, useSyncExternalStore } from "react";

/** Sticky storage problems that must stay visible until resolved, unlike transient status messages. */
export type StorageWarningKey = "browser-autosave" | "missing-model-files" | "saved-projects";

const warnings = new Map<StorageWarningKey, string>();
const listeners = new Set<() => void>();
let snapshot: readonly string[] = [];

export function setStorageWarning(key: StorageWarningKey, message: string | null) {
  if ((warnings.get(key) ?? null) === message) return;
  if (message) warnings.set(key, message);
  else warnings.delete(key);
  snapshot = [...warnings.values()];
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const getSnapshot = () => snapshot;

export function useStorageWarnings(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let openDocumentId: string | null | undefined;

/** A file-save warning belongs to the document it was raised for; drop it when another document opens. */
export function noteOpenDocument(documentId: string | null) {
  if (openDocumentId !== undefined && openDocumentId !== documentId) setStorageWarning("missing-model-files", null);
  openDocumentId = documentId;
}

export function useOpenDocumentWarnings(documentId: string | null) {
  useEffect(() => noteOpenDocument(documentId), [documentId]);
}
