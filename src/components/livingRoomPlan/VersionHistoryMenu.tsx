import { useEffect, useState } from "react";
import { snapshotsForProject } from "../../domain/projectSnapshots/history";
import { SNAPSHOT_REASON_LABELS } from "../../domain/projectSnapshots/snapshotSummary";
import type { ProjectSnapshot } from "../../domain/projectSnapshots/types";
import { indexedDbSnapshotStore } from "../../platform/indexedDbSnapshotStore";
import { snapshotTime } from "./VersionPreviewDialog";

/** Lists the open project's last snapshots; choosing one opens a preview before restoring. */
export function VersionHistoryMenu({ projectId, onChoose }: { projectId?: string | null; onChoose: (snapshot: ProjectSnapshot) => void }) {
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
          data-testid="version-history-item"
          onClick={() => onChoose(snapshot)}
        >
          {SNAPSHOT_REASON_LABELS[snapshot.reason] ?? "Saved version"} · {snapshotTime(snapshot.createdAt)}
        </button>
      ))}
    </div>
  );
}
