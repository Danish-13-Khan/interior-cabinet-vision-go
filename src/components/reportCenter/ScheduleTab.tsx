import type { ProjectReport } from "../../domain/projectReport";
import { money } from "./helpers";

type ScheduleTabProps = {
  report: ProjectReport;
  onSelectCabinet?: (cabinetId: string) => void;
};

export function ScheduleTab({ report, onSelectCabinet }: ScheduleTabProps) {
  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Cabinet Schedule</strong>
          <span>
            {report.cabinetSchedule.length} marks · shop-ready sizes and run assignment
          </span>
        </div>
      </header>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Mark</th>
              <th>Cabinet</th>
              <th>Type</th>
              <th>Size (mm)</th>
              <th>Run</th>
              <th>Parts</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {report.cabinetSchedule.map((row) => (
              <tr key={row.cabinetId}>
                <td>
                  <code className="shop-ref">{row.mark}</code>
                </td>
                <td>
                  <button
                    type="button"
                    className="shop-source-btn"
                    onClick={() => onSelectCabinet?.(row.cabinetId)}
                  >
                    {row.cabinetName}
                  </button>
                </td>
                <td>{row.typeLabel}</td>
                <td>
                  {row.widthMm} × {row.heightMm} × {row.depthMm}
                </td>
                <td>{row.runLabel ?? "—"}</td>
                <td>{row.partCount}</td>
                <td>{money(row.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
