import type { ProjectReport } from "../../domain/projectReport";

type RunsTabProps = {
  report: ProjectReport;
};

export function RunsTab({ report }: RunsTabProps) {
  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Room / Run Summary</strong>
          <span>
            {report.runSummaries.length} detected runs · fillers and countertops
          </span>
        </div>
      </header>
      {report.runSummaries.length === 0 ? (
        <p className="report-empty">
          No cabinet runs detected yet. Place cabinets along a wall to form a run.
        </p>
      ) : (
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Run</th>
                <th>Side</th>
                <th>Cabinets</th>
                <th>Length</th>
                <th>Fillers</th>
                <th>Tops</th>
                <th>Corner</th>
              </tr>
            </thead>
            <tbody>
              {report.runSummaries.map((run) => (
                <tr key={run.runId}>
                  <td>
                    <strong>{run.label}</strong>
                    <span className="shop-sub">{run.cabinetNames.join(", ")}</span>
                  </td>
                  <td>{run.side}</td>
                  <td>{run.cabinetCount}</td>
                  <td>{run.lengthMm} mm</td>
                  <td>{run.fillerCount}</td>
                  <td>{run.countertopCount}</td>
                  <td>{run.hasCorner ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
