import type { SnapshotReason } from "./types";

type Session = {
  capture: (reason: SnapshotReason) => void;
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

export function noteProjectSnapshot(reason: SnapshotReason) {
  session?.capture(reason);
}

export function restoreProjectSnapshot(document: unknown) {
  session?.restore(document);
}

export function subscribeSnapshotSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
