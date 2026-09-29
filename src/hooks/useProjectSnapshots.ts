import { useEffect, useRef } from "react";
import { bindSnapshotSession } from "../domain/projectSnapshots/capture";
import { buildSnapshot, recordSnapshot } from "../domain/projectSnapshots/history";
import { SNAPSHOT_INTERVAL_MS, type SnapshotReason } from "../domain/projectSnapshots/types";
import { indexedDbSnapshotStore } from "../platform/indexedDbSnapshotStore";

type Args = {
  document: unknown;
  cabinetCount: number;
  restore: (document: unknown) => void;
};

/** Interval copies plus milestones. The open draft stays the only autosave. */
export function useProjectSnapshots({ document, cabinetCount, restore }: Args) {
  const documentRef = useRef(document);
  documentRef.current = document;
  const dirty = useRef(false);
  const lastSaved = useRef("");
  const cabinets = useRef(cabinetCount);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    const fingerprint = JSON.stringify(document);
    if (lastSaved.current && fingerprint !== lastSaved.current) dirty.current = true;
    if (!lastSaved.current) lastSaved.current = fingerprint;
  }, [document]);

  useEffect(() => {
    const capture = (reason: SnapshotReason) => {
      const snapshot = buildSnapshot(documentRef.current, reason, new Date().toISOString());
      if (!snapshot) return;
      const fingerprint = JSON.stringify(snapshot.document);
      if (reason === "interval" && fingerprint === lastSaved.current) return;
      lastSaved.current = fingerprint;
      dirty.current = false;
      void recordSnapshot(indexedDbSnapshotStore, snapshot).catch(() => undefined);
    };
    const unbind = bindSnapshotSession({ capture, restore: (parsed) => restoreRef.current(parsed) });
    const timer = window.setInterval(() => {
      if (!dirty.current) return;
      capture("interval");
    }, SNAPSHOT_INTERVAL_MS);
    return () => {
      unbind();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (cabinets.current === 0 && cabinetCount === 1) {
      const snapshot = buildSnapshot(documentRef.current, "first-cabinet", new Date().toISOString());
      if (snapshot) void recordSnapshot(indexedDbSnapshotStore, snapshot).catch(() => undefined);
    }
    cabinets.current = cabinetCount;
  }, [cabinetCount]);
}
