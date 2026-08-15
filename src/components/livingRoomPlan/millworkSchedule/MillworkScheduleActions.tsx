export function MillworkScheduleActions({
  busy,
  status,
  disabled,
  millworkCount,
  readyToExport,
  onExportCsv,
  onExportPdf,
}: {
  busy: boolean;
  status: string;
  disabled: boolean;
  millworkCount: number;
  readyToExport: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  const blocked = disabled || busy || !readyToExport;
  return (
    <div className="lr-millwork-export">
      <button
        type="button"
        disabled={blocked}
        onClick={onExportCsv}
        title={readyToExport
          ? "Workshop CSV — millwork sizes from Plan/Model"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Schedule CSV
      </button>
      <button
        type="button"
        disabled={blocked}
        onClick={onExportPdf}
        title={readyToExport
          ? "Workshop PDF — millwork sizes from Plan/Model"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Schedule PDF
      </button>
      <small>{millworkCount} millwork</small>
      {status ? <span className="lr-millwork-status">{status}</span> : null}
    </div>
  );
}
