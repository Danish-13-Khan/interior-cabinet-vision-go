import { MillworkProductionExports } from "./MillworkProductionExports";

export function MillworkScheduleActions({
  busy,
  status,
  disabled,
  millworkCount,
  readyToExport,
  onExportScheduleCsv,
  onExportSchedulePdf,
  onExportCutlistCsv,
  onExportProductionPdf,
}: {
  busy: boolean;
  status: string;
  disabled: boolean;
  millworkCount: number;
  readyToExport: boolean;
  onExportScheduleCsv: () => void;
  onExportSchedulePdf: () => void;
  onExportCutlistCsv: () => void;
  onExportProductionPdf: () => void;
}) {
  const scheduleBlocked = disabled || busy || !readyToExport;
  const productionTriggerDisabled = disabled || busy;
  return (
    <div className="lr-millwork-export">
      <button
        type="button"
        disabled={scheduleBlocked}
        onClick={onExportScheduleCsv}
        title={disabled
          ? "Resolve blocking layout conflicts before exporting"
          : readyToExport
          ? "Workshop CSV — millwork sizes from Plan/Model"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Schedule CSV
      </button>
      <button
        type="button"
        className="is-primary"
        disabled={scheduleBlocked}
        onClick={onExportSchedulePdf}
        title={disabled
          ? "Resolve blocking layout conflicts before exporting"
          : readyToExport
          ? "Workshop PDF — millimetre takeoff from Plan/Model"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Schedule PDF
      </button>
      <MillworkProductionExports
        triggerDisabled={productionTriggerDisabled}
        menuBlocked={scheduleBlocked}
        onCutlist={onExportCutlistCsv}
        onProductionPdf={onExportProductionPdf}
      />
      <small>{millworkCount} millwork</small>
      {status ? <span className="lr-millwork-status">{status}</span> : null}
    </div>
  );
}
