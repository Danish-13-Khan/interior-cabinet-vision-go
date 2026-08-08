import type { ProjectReport } from "../../domain/projectReport";
import { money } from "./helpers";

type HardwareTabProps = {
  report: ProjectReport;
  onSelectCabinet?: (cabinetId: string) => void;
};

export function HardwareTab({ report, onSelectCabinet }: HardwareTabProps) {
  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Hardware Schedule</strong>
          <span>
            {report.hardwareSchedule.length} SKUs · project hardware ₹
            {report.hardwareSchedule
              .reduce((sum, row) => sum + row.totalCost, 0)
              .toLocaleString()}
          </span>
        </div>
        <strong>{money(report.projectCost.totalHardware)}</strong>
      </header>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Hardware</th>
              <th>Kind</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
              <th>Cabinets</th>
            </tr>
          </thead>
          <tbody>
            {report.hardwareSchedule.map((row) => (
              <tr key={row.hardwareId}>
                <td>
                  <strong>{row.label}</strong>
                </td>
                <td>{row.kind}</td>
                <td>{row.quantity}</td>
                <td>{money(row.unitCost)}</td>
                <td>
                  <strong>{money(row.totalCost)}</strong>
                </td>
                <td>
                  <code className="shop-ref">{row.cabinetMarks.join(" ")}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="report-subsection">
        <h3>By cabinet</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Mark</th>
                <th>Cabinet</th>
                <th>Insert</th>
                <th>Lines</th>
                <th>Hardware total</th>
              </tr>
            </thead>
            <tbody>
              {report.hardwareByCabinet.map((row) => (
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
                  <td>{row.insertKind}</td>
                  <td>{row.lines.length}</td>
                  <td>
                    <strong>{money(row.totalCost)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
