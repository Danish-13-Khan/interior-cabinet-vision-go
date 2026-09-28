import { useMemo } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { planClosedRoomModelRaise, setPlanWallsRaised } from "../../domain/interiorProject";

type Props = {
  reason: string | null;
  canRaise: boolean;
  onRaise: () => void;
};

/** In-canvas prompt when 3D would otherwise show only plan traces. */
export function PlanTraceEmptyState({ reason, canRaise, onRaise }: Props) {
  return (
    <div className="lr-plan-trace-empty" data-testid="plan-trace-empty">
      <div className="lr-plan-trace-empty-card">
        <h2>This room is still a 2D plan</h2>
        <p>
          {reason
            ?? "Raise the closed outline to extrude walls and the ceiling in this view."}
        </p>
        <button
          type="button"
          data-testid="plan-trace-raise"
          disabled={!canRaise}
          onClick={onRaise}
        >
          Raise room to 3D
        </button>
      </div>
    </div>
  );
}

/** Shows the raise prompt only while the room has not been extruded yet. */
export function PlanTraceRaisePrompt({ project, onPatchDocument }: {
  project: InteriorProject;
  onPatchDocument?: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
}) {
  const raisePlan = useMemo(() => planClosedRoomModelRaise(project), [project]);
  if (raisePlan.status === "ready") return null;
  return (
    <PlanTraceEmptyState
      reason={raisePlan.status === "blocked" ? raisePlan.reason : null}
      canRaise={raisePlan.status === "raise"}
      onRaise={() => {
        if (raisePlan.status !== "raise" || !onPatchDocument) return;
        const { wallIds, heightMm } = raisePlan;
        onPatchDocument(
          (current) => setPlanWallsRaised(current, wallIds, true, heightMm),
          "Raised walls to 3D.",
        );
      }}
    />
  );
}
