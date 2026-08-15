export function MillworkScheduleActions({
  busy,
  status,
  disabled,
  millworkCount,
  onExportCsv,
  onExportPdf,
}: {
  busy: boolean;
  status: string;
  disabled: boolean;
  millworkCount: number;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  return (
    <div className="lr-millwork-export">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onExportCsv}
        title="Workshop CSV — millwork sizes from Plan/Model"
      >
        Schedule CSV
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onExportPdf}
        title="Workshop PDF — millwork sizes from Plan/Model"
      >
        Schedule PDF
      </button>
      <small>{millworkCount} millwork</small>
      {status ? <span className="lr-millwork-status">{status}</span> : null}
    </div>
  );
}
