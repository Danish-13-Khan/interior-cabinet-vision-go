import type { ProjectReport } from "../../domain/projectReport";

type MaterialsTabProps = {
  report: ProjectReport;
};

export function MaterialsTab({ report }: MaterialsTabProps) {
  const yieldPlan = report.sheetYield;

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Material Takeoff</strong>
          <span>
            Grouped by material · thickness · sheet yield {yieldPlan.overallYieldPercent}%
          </span>
        </div>
        <strong>{yieldPlan.totalSheets} sheets</strong>
      </header>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Thickness</th>
              <th>Area</th>
              <th>Sheets</th>
              <th>Yield</th>
              <th>Waste</th>
              <th>Lines</th>
            </tr>
          </thead>
          <tbody>
            {report.materialSummary.map((row) => {
              const yieldGroup = yieldPlan.groups.find(
                (group) =>
                  group.material === row.material &&
                  group.thicknessMm === row.thicknessMm,
              );
              return (
                <tr key={`${row.material}-${row.thicknessMm}`}>
                  <td>
                    <strong>{row.material}</strong>
                  </td>
                  <td>{row.thicknessMm} mm</td>
                  <td>{row.totalAreaM2.toFixed(2)} m²</td>
                  <td>{row.estimatedBoards}</td>
                  <td>{yieldGroup ? `${yieldGroup.yieldPercent}%` : "—"}</td>
                  <td>
                    {yieldGroup ? `${yieldGroup.wasteAreaM2.toFixed(2)} m²` : "—"}
                  </td>
                  <td>{row.lineCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
