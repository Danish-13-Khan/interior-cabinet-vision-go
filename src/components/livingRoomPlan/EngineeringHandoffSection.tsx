import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";

type Handoff = ReturnType<typeof useEngineeringHandoff>;

export function EngineeringHandoffSection({ handoff }: { handoff: Handoff }) {
  const summary = handoff.summary;
  const gate = handoff.gate;
  if (!summary || !gate) return null;

  return (
    <section className="engineering-handoff" aria-label="Engineering handoff">
      <strong>Engineering handoff</strong>
      <small data-testid="handoff-revision">
        Rev {summary.revision} · {summary.cabinetCount} cabinet{summary.cabinetCount === 1 ? "" : "s"} · {summary.roomName}
      </small>
      <ul className="engineering-handoff-cabinets" data-testid="handoff-summary">
        {summary.cabinets.map((line) => (
          <li key={line.objectId} data-lossy={line.lossy ? "true" : "false"}>
            <span>{line.name}</span>
            <small>
              {line.cabinetId} · {line.cabinetType} · {line.familyId || "no family"} · {line.widthMm}×{line.heightMm}×{line.depthMm}
            </small>
          </li>
        ))}
        {summary.cabinets.length === 0 ? <li><small>No cabinets to hand off.</small></li> : null}
      </ul>
      {summary.warnings.length ? (
        <ul className="engineering-handoff-warnings" data-testid="handoff-diagnostics">
          {summary.warnings.map((note) => (
            <li key={`${note.code}-${note.path}`} className={note.blocking ? "is-blocking" : ""}>
              {note.message}
            </li>
          ))}
        </ul>
      ) : (
        <small>Adapter diagnostics clear. Same cabinet IDs will open in Cabinets.</small>
      )}
      {!gate.ready ? (
        <small className="is-warning" data-testid="handoff-blocked">
          {gate.items.map((item) => item.detail).join(" ")}
        </small>
      ) : null}
      {handoff.revisionApproved ? (
        <small data-testid="handoff-approved">Revision approved for Engineering.</small>
      ) : (
        <button
          type="button"
          data-testid="approve-engineering-revision"
          onClick={handoff.approveRevision}
          disabled={!handoff.canApprove}
        >
          Approve revision
        </button>
      )}
      <button
        type="button"
        className="is-primary engineering-handoff-send"
        data-testid="send-to-engineering"
        onClick={handoff.sendToEngineering}
        disabled={!gate.ready}
      >
        Send to Engineering
      </button>
    </section>
  );
}
