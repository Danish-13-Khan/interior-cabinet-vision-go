import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

export function InteriorsCabinetRunTray({ commands }: { commands: InteriorsCabinetRunCommands }) {
  const {
    wallId, snapWarning, selectedCount, selectedRunId, fillerCount, fillersEnabled,
    runLengthMm, remainingMm, completeSummary, leftoverMessage, planMarksEnabled,
    onCreateRun, onUpdateRun, onCompleteRun, onTogglePlanMarks,
  } = commands;
  return (
    <div className="lr-draw-tray lr-run-tray" data-testid="interiors-cabinet-run-tray">
      <button type="button" disabled={selectedCount < 2 || !wallId} onClick={onCreateRun}>
        Snap selection into run
      </button>
      {snapWarning ? (
        <span className="has-warning" data-testid="interiors-cabinet-run-snap-warning">{snapWarning}</span>
      ) : selectedRunId ? (
        <>
          <label className="lr-run-extend">
            <input
              type="checkbox"
              checked={fillersEnabled}
              onChange={(event) => onUpdateRun(selectedRunId, { fillersEnabled: event.target.checked })}
            />
            Auto fillers
          </label>
          <button
            type="button"
            data-testid="lr-complete-run"
            onClick={() => onCompleteRun(selectedRunId)}
          >
            Complete Run
          </button>
          <span>{fillerCount} filler{fillerCount === 1 ? "" : "s"} on this run</span>
          {runLengthMm != null ? <span>{runLengthMm} mm run</span> : null}
          {completeSummary ? <span data-testid="lr-complete-run-summary">{completeSummary}</span> : null}
          {leftoverMessage ? (
            <span className="has-warning" data-testid="lr-complete-run-leftover">{leftoverMessage}</span>
          ) : null}
          <span data-testid="interiors-cabinet-run-countertop-hint">Countertop follows the floor run</span>
        </>
      ) : (
        <span>Select two or more cabinets on a wall, then snap them into a run</span>
      )}
      {remainingMm != null ? (
        <span data-testid="lr-remaining-wall">Remaining on wall: {remainingMm} mm</span>
      ) : null}
      <label className="lr-run-extend">
        <input
          type="checkbox"
          checked={planMarksEnabled}
          data-testid="lr-plan-marks-toggle"
          onChange={(event) => onTogglePlanMarks(event.target.checked)}
        />
        Plan marks
      </label>
    </div>
  );
}
