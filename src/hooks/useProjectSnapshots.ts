import { useEffect, useRef } from "react";
import { captureSnapshotIfAllowed } from "../domain/projectDrafts/browserSignals";
import { bindSnapshotSession } from "../domain/projectSnapshots/capture";
import { editingSnapshotDue, noteEdit, shouldSnapshotFirstCabinet, type EditingClock } from "../domain/projectSnapshots/editingClock";
import { buildSnapshot, recordSnapshot } from "../domain/projectSnapshots/history";
import { SNAPSHOT_INTERVAL_MS, type SnapshotReason } from "../domain/projectSnapshots/types";
import { indexedDbSnapshotStore } from "../platform/indexedDbSnapshotStore";

type Args = {
  document: unknown;
  cabinetCount: number;
  restore: (document: unknown) => void;
};

function projectIdOf(document: unknown): string | null {
  if (!document || typeof document !== "object") return null;
  const id = (document as { id?: unknown }).id;
  return typeof id === "string" && id ? id : null;
}

/** Interval copies plus milestones. The open draft stays the only autosave. */
export function useProjectSnapshots({ document, cabinetCount, restore }: Args) {
  const documentRef = useRef(document);
  documentRef.current = document;
  const lastSaved = useRef("");
  const cabinets = useRef(cabinetCount);
  const seenProject = useRef<string | null>(null);
  const clock = useRef<EditingClock>({ accumulatedMs: 0, lastEditAt: null });
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const captureRef = useRef<(reason: SnapshotReason, override?: unknown) => void>(() => undefined);

  useEffect(() => {
    const capture = (reason: SnapshotReason, override?: unknown) => captureSnapshotIfAllowed(() => {
      const snapshot = buildSnapshot(override ?? documentRef.current, reason, new Date().toISOString());
      if (!snapshot) return;
      const fingerprint = JSON.stringify(snapshot.document);
      if (reason === "interval" && fingerprint === lastSaved.current) return;
      lastSaved.current = fingerprint;
      if (reason === "interval") clock.current = { accumulatedMs: 0, lastEditAt: performance.now() };
      void recordSnapshot(indexedDbSnapshotStore, snapshot).catch(() => undefined);
    });
    captureRef.current = capture;
    return bindSnapshotSession({ capture, restore: (parsed) => restoreRef.current(parsed), current: () => documentRef.current });
  }, []);

  useEffect(() => {
    const fingerprint = JSON.stringify(document);
    const id = projectIdOf(document);
    const projectChanged = seenProject.current !== id;
    if (projectChanged) {
      seenProject.current = id;
      lastSaved.current = fingerprint;
      clock.current = { accumulatedMs: 0, lastEditAt: null };
      cabinets.current = cabinetCount;
      return;
    }
    if (lastSaved.current && fingerprint !== lastSaved.current) {
      clock.current = noteEdit(clock.current, performance.now());
      if (editingSnapshotDue(clock.current, SNAPSHOT_INTERVAL_MS)) captureRef.current("interval");
    }
    if (shouldSnapshotFirstCabinet(cabinets.current, cabinetCount, false)) captureRef.current("first-cabinet");
    cabinets.current = cabinetCount;
  }, [document, cabinetCount]);
}
