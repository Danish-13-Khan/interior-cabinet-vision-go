import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";

type Handoff = ReturnType<typeof useEngineeringHandoff>;

function HandoffCabinetList({ handoff }: { handoff: Handoff }) {
  const cabinets = handoff.summary?.cabinets ?? [];
  return (
    <ul className="engineering-handoff-cabinets" data-testid="handoff-summary">
      {cabinets.map((line) => (
        <li key={line.objectId} data-object-id={line.objectId} data-cabinet-id={line.cabinetId} data-lossy={line.lossy ? "true" : "false"}>
          <span>{line.name}</span>
          <small>
            {line.cabinetId} · {line.cabinetType} · {line.familyId || "no family"} · {line.widthMm}×{line.heightMm}×{line.depthMm}
          </small>
        </li>
      ))}
      {cabinets.length === 0 ? <li><small>No cabinets to hand off.</small></li> : null}
    </ul>
  );
}

function HandoffDiagnostics({
  warnings,
  blockingOnly,
  testId,
}: {
  warnings: NonNullable<Handoff["summary"]>["warnings"];
  blockingOnly?: boolean;
  testId?: string;
}) {
  const rows = blockingOnly ? warnings.filter((note) => note.blocking) : warnings;
  if (!rows.length) {
    return blockingOnly ? null : (
      <small>Adapter diagnostics clear. Same cabinet IDs will open in Cabinets.</small>
    );
  }
  return (
    <ul className="engineering-handoff-warnings" data-testid={testId}>
      {rows.map((note) => (
        <li key={`${note.code}-${note.path}`} className={note.blocking ? "is-blocking" : ""}>
          {note.message}
        </li>
      ))}
    </ul>
  );
}

export function EngineeringHandoffSection({
  handoff,
  compact,
}: {
  handoff: Handoff;
  compact?: boolean;
}) {
  const summary = handoff.summary;
  const gate = handoff.gate;
  if (!summary || !gate) return null;

  return (
    <section className="engineering-handoff" aria-label="Engineering handoff">
      <strong>Engineering handoff</strong>
      <small data-testid="handoff-revision">
        Rev {summary.revision} · {summary.cabinetCount} cabinet{summary.cabinetCount === 1 ? "" : "s"} · {summary.roomName}
      </small>
      {compact ? (
        <>
          <HandoffDiagnostics warnings={summary.warnings} blockingOnly testId="handoff-diagnostics" />
          <details className="engineering-handoff-identities" data-testid="handoff-identities">
            <summary>Cabinet identities</summary>
            <HandoffCabinetList handoff={handoff} />
            <HandoffDiagnostics warnings={summary.warnings} />
          </details>
        </>
      ) : (
        <>
          <HandoffCabinetList handoff={handoff} />
          <HandoffDiagnostics warnings={summary.warnings} testId="handoff-diagnostics" />
        </>
      )}
      {!gate.ready && !compact ? (
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
