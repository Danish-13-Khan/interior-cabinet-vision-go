import type { ProjectReport } from "../domain/projectReport";

type ProjectReportPanelProps = {
  report: ProjectReport;
};

/** @deprecated Prefer ReportCenter for Phase 11 shop documents. */
export function ProjectReportPanel({ report }: ProjectReportPanelProps) {
  return (
    <div className="report-panel">
      <div className="report-summary-grid">
        <div className="report-card">
          <span className="report-card-label">Project Items</span>
          <strong>{report.summary.itemCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Cabinet Items</span>
          <strong>{report.summary.cabinetCount}</strong>
        </div>
        <div className="report-card report-card-wide">
          <span className="report-card-label">Room Size</span>
          <strong>{report.summary.roomSizeLabel}</strong>
        </div>
      </div>

      <div className="report-cost-grid">
        <div className="report-card">
          <span className="report-card-label">Material</span>
          <strong>₹{report.projectCost.totalMaterial.toLocaleString()}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Hardware</span>
          <strong>₹{report.projectCost.totalHardware.toLocaleString()}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Labour</span>
          <strong>₹{report.projectCost.totalLabour.toLocaleString()}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Project Total</span>
          <strong>₹{report.projectCost.grandTotal.toLocaleString()}</strong>
        </div>
      </div>

      <div className="report-section">
        <div className="section-heading">
          <h2>Cabinet Totals</h2>
          <span>{report.perItemCutlists.length} items</span>
        </div>
        <div className="report-table">
          {report.perItemCutlists.map((row) => (
            <div key={row.cabinetId} className="report-row">
              <strong>{row.cabinetName}</strong>
              <span>{row.lines.length} part lines</span>
              <span>₹{row.cost.totalCost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
