import type { MillworkSchedule } from "../../domain/livingRoom/millworkSchedule";

export function PlannerV2ReviewPanel({
  schedule,
  issues,
  busy,
  status,
  onCsv,
  onPdf,
}: {
  schedule: MillworkSchedule | null;
  issues: number;
  busy: boolean;
  status: string;
  onCsv: () => void;
  onPdf: () => void;
}) {
  return <aside className="planner-v2-review" aria-label="Review and export">
    <header><span>Review + export</span><small>{issues ? `${issues} layout warnings` : "Layout checks clear"}</small></header>
    <section><strong>Millwork schedule</strong><small>{schedule?.lines.length ?? 0} cabinet items</small>
      {schedule?.lines.slice(0, 4).map((line) => <div key={line.objectId}><span>{line.name}</span><small>{line.widthMm} × {line.heightMm} × {line.depthMm}</small></div>)}
      {!schedule?.lines.length ? <p>No cabinet items placed yet.</p> : null}
    </section>
    <section><strong>Workshop files</strong><small>Generated from the saved project dimensions.</small>
      <button type="button" onClick={onCsv} disabled={busy}>Export CSV</button>
      <button type="button" className="is-primary" onClick={onPdf} disabled={busy}>Export PDF</button>
    </section>
    {status ? <p className="planner-v2-review-status">{status}</p> : null}
  </aside>;
}
