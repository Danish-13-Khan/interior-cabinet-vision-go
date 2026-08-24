export function MillworkScheduleActions({
  busy,
  status,
  disabled,
  millworkCount,
  readyToExport,
  onExportScheduleCsv,
  onExportCutlistCsv,
  onExportPdf,
}: {
  busy: boolean;
  status: string;
  disabled: boolean;
  millworkCount: number;
  readyToExport: boolean;
  onExportScheduleCsv: () => void;
  onExportCutlistCsv: () => void;
  onExportPdf: () => void;
}) {
  const blocked = disabled || busy || !readyToExport;
  return (
    <div className="lr-millwork-export">
      <button
        type="button"
        disabled={blocked}
        onClick={onExportScheduleCsv}
        title={readyToExport
          ? "Workshop CSV — millwork sizes from Plan/Model"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Schedule CSV
      </button>
      <button
        type="button"
        disabled={blocked}
        onClick={onExportCutlistCsv}
        title={readyToExport
          ? "Production cutlist CSV — construction parts and board details"
          : "Add cabinets in Plan before exporting the production cutlist"}
      >
        Cutlist CSV
      </button>
      <button
        type="button"
        disabled={blocked}
        onClick={onExportPdf}
        title={readyToExport
          ? "Production packet PDF — schedule, technical sheets, cutlist, and costing"
          : "Add millwork in Plan before exporting the schedule"}
      >
        Production PDF
      </button>
      <small>{millworkCount} millwork</small>
      {status ? <span className="lr-millwork-status">{status}</span> : null}
    </div>
  );
}
