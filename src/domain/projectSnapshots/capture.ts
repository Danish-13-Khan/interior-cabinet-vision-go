import type { SnapshotReason } from "./types";

type Session = {
  capture: (reason: SnapshotReason, document?: unknown) => void;
  restore: (document: unknown) => void;
};

let session: Session | null = null;
const listeners = new Set<() => void>();

export function bindSnapshotSession(next: Session): () => void {
  session = next;
  listeners.forEach((listener) => listener());
  return () => {
    if (session === next) session = null;
  };
}

export function noteProjectSnapshot(reason: SnapshotReason, document?: unknown) {
  session?.capture(reason, document);
}

export function restoreProjectSnapshot(document: unknown) {
  session?.restore(document);
}

export function subscribeSnapshotSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
