import type { ProjectReport } from "../domain/projectReport";

type ProjectReportPanelProps = {
  report: ProjectReport;
};

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

      <div className="report-columns">
        <div className="report-section">
          <div className="section-heading">
            <h2>Item List</h2>
            <span>{report.itemList.length} items</span>
          </div>
          <div className="report-table">
            {report.itemList.map((item) => (
              <div key={item.id} className="report-row">
                <strong>{item.name}</strong>
                <span>{item.typeLabel}</span>
                <span>{item.widthMm} × {item.heightMm} × {item.depthMm} mm</span>
                <span>X {item.x} · Z {item.z} · {item.rotation}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <div className="section-heading">
            <h2>Material Summary</h2>
            <span>{report.materialSummary.length} groups</span>
          </div>
          <div className="report-table">
            {report.materialSummary.map((row) => (
              <div key={`${row.material}-${row.thicknessMm}`} className="report-row">
                <strong>{row.material}</strong>
                <span>{row.thicknessMm} mm</span>
                <span>{row.totalAreaM2.toFixed(2)} m²</span>
                <span>{row.estimatedBoards} boards</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-columns">
        <div className="report-section">
          <div className="section-heading">
            <h2>By Material</h2>
            <span>{report.groupedByMaterial.length} groups</span>
          </div>
          <div className="report-group-list">
            {report.groupedByMaterial.map((group) => (
              <div key={group.title} className="report-group">
                <strong>{group.title}</strong>
                {group.items.slice(0, 6).map((row) => (
                  <span key={`${row.cabinetId}-${row.part.key}`}>
                    {row.cabinetName}: {row.part.label} ({row.part.qty}x)
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <div className="section-heading">
            <h2>By Thickness</h2>
            <span>{report.groupedByThickness.length} groups</span>
          </div>
          <div className="report-group-list">
            {report.groupedByThickness.map((group) => (
              <div key={group.title} className="report-group">
                <strong>{group.title}</strong>
                {group.items.slice(0, 6).map((row) => (
                  <span key={`${row.cabinetId}-${row.part.key}`}>
                    {row.cabinetName}: {row.part.label} ({row.part.material})
                  </span>
                ))}
              </div>
            ))}
          </div>
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
              <span>{row.items.length} cutlist lines</span>
              <span>{row.parts.length} part lines</span>
              <span>₹{row.cost.totalCost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
