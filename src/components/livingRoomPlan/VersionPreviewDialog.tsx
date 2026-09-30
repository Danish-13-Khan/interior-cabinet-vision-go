import { useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import { restoreSnapshot } from "../../domain/projectSnapshots/history";
import { currentProjectDocument, restoreProjectSnapshotWithBackup } from "../../domain/projectSnapshots/capture";
import { SNAPSHOT_REASON_LABELS, compareSnapshot, countLabel } from "../../domain/projectSnapshots/snapshotSummary";
import type { ProjectSnapshot } from "../../domain/projectSnapshots/types";

export function snapshotTime(createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;
  return parsed.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

function readSnapshot(snapshot: ProjectSnapshot): unknown {
  try {
    return restoreSnapshot(snapshot);
  } catch {
    return null;
  }
}

const TEST_ID = "version-preview";

/** Shows what a version holds and how it differs from now, before anything is restored. */
export function VersionPreviewDialog({ snapshot, onClose }: { snapshot: ProjectSnapshot | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(Boolean(snapshot), dialogRef, onClose);
  const restored = useMemo(() => (snapshot ? readSnapshot(snapshot) : null), [snapshot]);
  const comparison = useMemo(() => (snapshot ? compareSnapshot(restored, currentProjectDocument()) : null), [restored, snapshot]);

  if (!snapshot || !comparison) return null;
  const { snapshot: outline, current, changes } = comparison;
  const canRestore = restored != null;

  return createPortal(
    <div className="app-confirm-backdrop" data-testid={`${TEST_ID}-backdrop`} onKeyDown={(event) => event.stopPropagation()}>
      <div
        ref={dialogRef}
        className="app-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${TEST_ID}-title`}
        aria-describedby={`${TEST_ID}-message`}
        data-testid={TEST_ID}
        tabIndex={-1}
      >
        <strong id={`${TEST_ID}-title`}>Version from {snapshotTime(snapshot.createdAt)}</strong>
        <p id={`${TEST_ID}-message`}>
          {SNAPSHOT_REASON_LABELS[snapshot.reason] ?? "Saved version"} · {outline.name}
        </p>
        <ul className="app-confirm-summary" data-testid={`${TEST_ID}-counts`}>
          <li>{countLabel(outline.rooms, "rooms")}, {countLabel(outline.walls, "walls")}, {countLabel(outline.openings, "openings")}</li>
          <li>{countLabel(outline.cabinets, "cabinets")}, {countLabel(outline.objects, "objects")}</li>
          <li>{countLabel(outline.importedModels, "importedModels")}</li>
        </ul>
        <p data-testid={`${TEST_ID}-changes`}>
          {!canRestore
            ? "This version could not be read."
            : !current
              ? "Could not compare with the open project."
              : changes.length
                ? `Compared with now: ${changes.join(", ")}.`
                : "Same contents as now."}
        </p>
        <p>Your current state is kept in history, so you can undo this.</p>
        <div className="app-confirm-actions">
          <button type="button" data-testid={`${TEST_ID}-cancel`} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="is-primary"
            data-testid={`${TEST_ID}-confirm`}
            data-dialog-initial-focus
            disabled={!canRestore}
            onClick={() => {
              onClose();
              restoreProjectSnapshotWithBackup(restored);
            }}
          >
            Restore this version
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
