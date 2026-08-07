import {
  MACHINE_EXPORT_DISCLAIMER,
  listPreviewOperations,
  type MachineJobDocument,
} from "../../domain/machineExport";

type MachiningPreviewPanelProps = {
  document: MachineJobDocument;
  onExportJson?: () => void;
  onExportCsv?: () => void;
};

export function MachiningPreviewPanel({
  document,
  onExportJson,
  onExportCsv,
}: MachiningPreviewPanelProps) {
  const rows = listPreviewOperations(document.parts).slice(0, 80);

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Machining Preview</strong>
          <span>
            Intent metadata for future machine adapters · schema v
            {document.schemaVersion}
          </span>
        </div>
        <div className="library-manager-actions">
          {onExportJson ? (
            <button type="button" className="tb-btn" onClick={onExportJson}>
              Export JSON
            </button>
          ) : null}
          {onExportCsv ? (
            <button type="button" className="tb-btn" onClick={onExportCsv}>
              Export Ops CSV
            </button>
          ) : null}
        </div>
      </header>

      <p className="library-manager-message">{MACHINE_EXPORT_DISCLAIMER}</p>

      <div className="report-summary-grid">
        <div className="report-card">
          <span className="report-card-label">Parts</span>
          <strong>{document.summary.partCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Operations</span>
          <strong>{document.summary.operationCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Cut blanks</span>
          <strong>{document.summary.cutIntentCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Drill intents</span>
          <strong>{document.summary.drillIntentCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Groove / rebate</span>
          <strong>{document.summary.grooveIntentCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Unverified</span>
          <strong>{document.summary.unverifiedCount}</strong>
        </div>
      </div>

      <section className="report-subsection">
        <h3>Operation preview</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Shop ref</th>
                <th>Part</th>
                <th>Op</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Orientation</th>
                <th>Blank</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No machining intents derived yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.shopRef}-${row.operation.id}`}>
                    <td>{row.shopRef}</td>
                    <td>
                      <strong>{row.partLabel}</strong>
                      <span className="shop-sub">
                        {row.cabinetName} · {row.category}
                      </span>
                    </td>
                    <td>
                      <strong>{row.operation.label}</strong>
                      <span className="shop-sub">{row.operation.description}</span>
                    </td>
                    <td>{row.operation.kind}</td>
                    <td>{row.operation.status}</td>
                    <td>
                      {row.orientation.faceUp} · grain {row.orientation.grainAlong} ·{" "}
                      {row.orientation.originCorner}
                    </td>
                    <td>
                      {row.blank.lengthMm}×{row.blank.widthMm}×{row.blank.thicknessMm}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {document.summary.operationCount > rows.length ? (
          <p className="shop-sub">
            Showing first {rows.length} of {document.summary.operationCount} operations.
            Export JSON/CSV for the full intent pack.
          </p>
        ) : null}
      </section>
    </div>
  );
}
