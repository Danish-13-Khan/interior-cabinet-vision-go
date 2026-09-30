import { useEffect, useState } from "react";
import { restoreSnapshot, snapshotsForProject } from "../../domain/projectSnapshots/history";
import { restoreProjectSnapshot } from "../../domain/projectSnapshots/capture";
import type { ProjectSnapshot, SnapshotReason } from "../../domain/projectSnapshots/types";
import { indexedDbSnapshotStore } from "../../platform/indexedDbSnapshotStore";

const REASONS: Record<SnapshotReason, string> = {
  interval: "Autosave",
  "room-closed": "Room closed",
  "first-cabinet": "First cabinet",
  render: "Render",
};

function when(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;
  return parsed.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

/** Preview and restore the last snapshots for the open project. */
export function VersionHistoryMenu({ projectId }: { projectId?: string | null }) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  useEffect(() => {
    let live = true;
    void indexedDbSnapshotStore.list().then((all) => {
      if (live) setSnapshots(snapshotsForProject(all, projectId));
    }).catch(() => { if (live) setSnapshots([]); });
    return () => { live = false; };
  }, [projectId]);
  if (snapshots.length === 0) return <p className="lr-chrome-history-empty">No saved versions yet.</p>;
  return (
    <div className="lr-chrome-history-list" role="group" aria-label="Version history">
      {snapshots.map((snapshot) => (
        <button
          key={snapshot.id}
          type="button"
          role="menuitem"
          onClick={() => restoreProjectSnapshot(restoreSnapshot(snapshot))}
        >
          {REASONS[snapshot.reason]} · {when(snapshot.createdAt)}
        </button>
      ))}
    </div>
  );
}
