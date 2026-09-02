import { useState } from "react";
import {
  interiorsDrawRoomCounts,
  interiorsDrawRoomRoomCounts,
  interiorsDrawRoomValidity,
} from "../../domain/desktopUx";
import { isBlockingLivingRoomPlanIssue, type LivingRoomPlanIssue } from "../../domain/livingRoom";
import type { InteriorProject } from "../../domain/interiorProject";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";

export function InteriorsDrawRoomStatus({
  project,
  issues,
  unit,
  onSelect,
}: {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  unit: string;
  onSelect: (objectId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const counts = interiorsDrawRoomRoomCounts(project);
  const blockingCount = issues.filter(isBlockingLivingRoomPlanIssue).length;
  const validity = interiorsDrawRoomValidity(blockingCount);
  return (
    <footer className="lr-plan-status lr-draw-status" data-testid="interiors-draw-status">
      <span>{unit === "mm" ? "Metric" : unit}</span>
      <span>Scale fit</span>
      <span>{interiorsDrawRoomCounts(counts)}</span>
      <div className="lr-draw-issues">
        <button
          type="button"
          className={validity.ok ? "is-clear" : "has-warning"}
          aria-expanded={open}
          aria-controls="interiors-draw-issues"
          data-testid="interiors-draw-issues-toggle"
          onClick={() => setOpen((current) => !current)}
        >
          {validity.label}
        </button>
        {open ? (
          <div id="interiors-draw-issues" className="lr-draw-issues-pop" data-testid="interiors-draw-issues">
            <InspectorLayoutChecks
              issues={issues}
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
