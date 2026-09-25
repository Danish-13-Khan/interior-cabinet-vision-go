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
