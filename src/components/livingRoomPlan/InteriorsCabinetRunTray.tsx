import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";

export function InteriorsCabinetRunTray({ commands }: { commands: InteriorsCabinetRunCommands }) {
  const {
    wallId, snapWarning, selectedCount, selectedRunId, fillerCount, fillersEnabled,
    runLengthMm, onCreateRun, onUpdateRun,
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
          <span>{fillerCount} filler{fillerCount === 1 ? "" : "s"} on this run</span>
          {runLengthMm != null ? <span>{runLengthMm} mm run</span> : null}
          <span data-testid="interiors-cabinet-run-countertop-hint">Countertop follows the floor run</span>
        </>
      ) : (
        <span>Select two or more cabinets on a wall, then snap them into a run</span>
      )}
    </div>
  );
}
