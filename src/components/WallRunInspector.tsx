import type { CabinetRun } from "../domain/cabinetLibrary";
import type { WallLayoutSummary } from "../domain/wallLayout";

type WallRunInspectorProps = {
  run: CabinetRun | null;
  summary: WallLayoutSummary;
  fillerCount: number;
  countertopCount: number;
  onSelectRun: () => void;
  onAutoPack: () => void;
};

export function WallRunInspector({
  run,
  summary,
  fillerCount,
  countertopCount,
  onSelectRun,
  onAutoPack,
}: WallRunInspectorProps) {
  return (
    <section className="property-section wall-run-inspector">
      <div className="property-section-heading">
        <div>
          <strong>Run Inspector</strong>
          <span>{summary.label} · {summary.lengthMm} mm</span>
        </div>
        <span className="property-badge">{run ? run.id.toUpperCase() : "NO RUN"}</span>
      </div>
      {run ? (
        <>
          <div className="wall-run-inspector-grid">
            <div><span>Band</span><strong>{run.band}</strong></div>
            <div><span>Members</span><strong>{run.cabinetIds.length}</strong></div>
            <div><span>Fillers</span><strong>{fillerCount}</strong></div>
            <div><span>Countertops</span><strong>{countertopCount}</strong></div>
          </div>
          <div className="wall-run-inspector-actions">
            <button type="button" onClick={onSelectRun}>Select Run</button>
            <button type="button" onClick={onAutoPack}>Pack to Wall</button>
          </div>
          {run.cornerTransition ? <p className="engineering-note">Corner transition detected.</p> : null}
        </>
      ) : (
        <p className="engineering-note">Select a cabinet on this wall to inspect its run.</p>
      )}
    </section>
  );
}
