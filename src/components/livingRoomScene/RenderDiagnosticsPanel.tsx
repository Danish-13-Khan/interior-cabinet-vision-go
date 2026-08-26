import type { RenderDiagnosticsReport } from "../../rendering/qa";

type RenderDiagnosticsPanelProps = {
  report: RenderDiagnosticsReport;
  compact?: boolean;
};

export function RenderDiagnosticsPanel({
  report,
  compact = false,
}: RenderDiagnosticsPanelProps) {
  const errors = report.warnings.filter((item) => item.severity === "error");
  const warnings = report.warnings.filter((item) => item.severity === "warning");

  return (
    <aside
      className={`lr-render-diagnostics${compact ? " is-compact" : ""}`}
      aria-label="Render diagnostics"
      data-testid="render-diagnostics"
    >
      <header>
        <strong>Render Diagnostics</strong>
        <span>{report.camera.ok ? "FRAMING OK" : "FRAMING ISSUE"}</span>
      </header>
      <dl>
        <div><dt>GLB</dt><dd>{report.glbNodeCount}</dd></div>
        <div><dt>GLB fallbacks</dt><dd>{report.proceduralFallbackCount}</dd></div>
        <div><dt>Material fallbacks</dt><dd>{report.materialFallbackCount}</dd></div>
        <div><dt>HDRI</dt><dd>{report.hdriFallback ? "fallback" : "ok"}</dd></div>
        <div><dt>Camera</dt><dd>{report.camera.cameraName ?? report.camera.cameraId ?? "none"}</dd></div>
      </dl>
      {errors.length || warnings.length ? (
        <ul>
          {[...errors, ...warnings].slice(0, compact ? 4 : 8).map((item) => (
            <li key={`${item.code}-${item.subjectId ?? ""}-${item.message}`}>
              <b data-severity={item.severity}>{item.severity === "error" ? "E" : "W"}</b>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No asset or framing warnings.</p>
      )}
    </aside>
  );
}
