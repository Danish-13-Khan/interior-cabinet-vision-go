type LibraryOverviewTabProps = {
  summary: {
    doorStyles: number;
    materials: number;
    hardware: number;
    countertops: number;
    standardsPacks: number;
    cabinetPresets: number;
  };
};

export function LibraryOverviewTab({ summary }: LibraryOverviewTabProps) {
  return (
    <div className="report-summary-grid">
      <div className="report-card">
        <span className="report-card-label">Door styles</span>
        <strong>{summary.doorStyles}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Materials</span>
        <strong>{summary.materials}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Hardware</span>
        <strong>{summary.hardware}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Countertops</span>
        <strong>{summary.countertops}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Standards packs</span>
        <strong>{summary.standardsPacks}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">User cabinet presets</span>
        <strong>{summary.cabinetPresets}</strong>
      </div>
    </div>
  );
}
