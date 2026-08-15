import type { StillJobValidation, StillProvenance } from "../../domain/livingRoom";

type StillTrustPanelProps = {
  validation: StillJobValidation | null;
  provenance: StillProvenance | null;
  overlay?: boolean;
};

export function StillTrustPanel({ validation, provenance, overlay = false }: StillTrustPanelProps) {
  const failed = validation?.gates.filter((gate) => !gate.pass) ?? [];
  return (
    <aside
      className={`lr-still-trust${overlay ? " is-overlay" : ""}`}
      data-testid="still-trust-panel"
      aria-label="Still provenance"
    >
      <header>
        <strong>Still provenance</strong>
        <span className={validation?.ok === false ? "is-fail" : "is-ok"}>
          {validation ? (validation.ok ? "TRUST OK" : "TRUST FAIL") : "NO JOB"}
        </span>
      </header>
      {provenance ? (
        <dl>
          <div><dt>Engine</dt><dd>{provenance.engine.id} {provenance.engine.version}</dd></div>
          <div><dt>Camera</dt><dd>{provenance.cameraId.slice(-8)}</dd></div>
          <div><dt>Hash</dt><dd>{provenance.projectContentHash.slice(-10)}</dd></div>
          <div><dt>Seed</dt><dd>{provenance.seed}</dd></div>
          <div><dt>Status</dt><dd>{provenance.acceptanceStatus}</dd></div>
        </dl>
      ) : (
        <p>Generate a still to bind engine, seed, and project hash.</p>
      )}
      {failed.length ? (
        <p className="is-fail">Failed: {failed.map((gate) => gate.id).join(", ")}</p>
      ) : null}
    </aside>
  );
}
