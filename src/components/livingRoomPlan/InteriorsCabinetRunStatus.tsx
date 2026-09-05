import { useState } from "react";
import {
  interiorsCabinetRunCountLabel,
  interiorsCabinetRunCounts,
  interiorsCabinetRunWarnings,
} from "../../domain/desktopUx";
import {
  cabinetRunForObject,
  isBlockingLivingRoomPlanIssue,
  previewCabinetRunPlacement,
  type LivingRoomPlanIssue,
} from "../../domain/livingRoom";
import type { InteriorProject } from "../../domain/interiorProject";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";

export function InteriorsCabinetRunStatus({
  project,
  issues,
  selectedIds,
  snapSizeMm,
  activeWallId,
  preDropReason,
  onSelect,
}: {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  selectedIds: readonly string[];
  snapSizeMm: number;
  activeWallId?: string | null;
  preDropReason?: string | null;
  onSelect: (objectId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const counts = interiorsCabinetRunCounts(project);
  const warnings = interiorsCabinetRunWarnings(issues, selectedIds);
  const blocking = warnings.filter(isBlockingLivingRoomPlanIssue).length;
  const label = warnings.length
    ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}${blocking ? ` · ${blocking} blocking` : ""}`
    : "Layout checks clear";
  const selectedRun = selectedIds
    .map((id) => project.objects.find((object) => object.id === id))
    .map((object) => (object ? cabinetRunForObject(object) : null))
    .find(Boolean);
  const wallId = activeWallId ?? selectedRun?.wallId ?? null;
  const remaining = wallId
    ? previewCabinetRunPlacement(project, wallId, { runId: selectedRun?.runId, roomId: project.activeRoomId })?.remainingMm
    : null;
  return (
    <footer className="lr-plan-status lr-draw-status lr-run-status" data-testid="interiors-cabinet-run-status">
      <span>Snap {snapSizeMm} mm</span>
      <span>{interiorsCabinetRunCountLabel(counts)}</span>
      {remaining != null ? (
        <span data-testid="lr-remaining-wall">Remaining on wall: {remaining} mm</span>
      ) : null}
      {preDropReason ? (
        <span className="has-warning" data-testid="lr-predrop-reason">{preDropReason}</span>
      ) : null}
      <div className="lr-draw-issues">
        <button
          type="button"
          className={warnings.length ? "has-warning" : "is-clear"}
          aria-expanded={open}
          aria-controls="interiors-cabinet-run-issues"
          data-testid="interiors-cabinet-run-issues-toggle"
          onClick={() => setOpen((current) => !current)}
        >
          {label}
        </button>
        {open ? (
          <div id="interiors-cabinet-run-issues" className="lr-draw-issues-pop" data-testid="interiors-cabinet-run-issues">
            <InspectorLayoutChecks
              issues={warnings}
              onSelect={(objectId) => {
                onSelect(objectId);
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </footer>
  );
}
