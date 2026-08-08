import { useState } from "react";
import type { ProjectReport } from "../../domain/projectReport";
import type { SheetOptimizerSettings } from "../../domain/sheetStock";
import {
  DEFAULT_SHEET_STOCK,
  getSheetStockDefinition,
} from "../../domain/sheetStock";

type OptimizeTabProps = {
  report: ProjectReport;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onSheetOptimizerChange: (next: SheetOptimizerSettings) => void;
};

export function OptimizeTab({
  report,
  sheetOptimizerSettings,
  onSheetOptimizerChange,
}: OptimizeTabProps) {
  const [expandedYieldKey, setExpandedYieldKey] = useState<string | null>(null);
  const yieldPlan = report.sheetYield;
  const activeSheet = getSheetStockDefinition(sheetOptimizerSettings.sheetId);

  function patchSheetOptimizer(patch: Partial<SheetOptimizerSettings>) {
    onSheetOptimizerChange({ ...sheetOptimizerSettings, ...patch });
  }

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Sheet Yield Planning</strong>
          <span>
            {activeSheet.label} · usable {yieldPlan.usableLengthMm}×{yieldPlan.usableWidthMm}{" "}
            · kerf {sheetOptimizerSettings.kerfMm} mm
          </span>
        </div>
        <strong>{yieldPlan.overallYieldPercent}% yield</strong>
      </header>

      <div className="costing-controls">
        <label>
          Sheet stock
          <select
            value={sheetOptimizerSettings.sheetId}
            onChange={(event) =>
              patchSheetOptimizer({ sheetId: event.currentTarget.value })
            }
          >
            {DEFAULT_SHEET_STOCK.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kerf mm
          <input
            type="number"
            min={0}
            max={12}
            step={1}
            value={sheetOptimizerSettings.kerfMm}
            onChange={(event) =>
              patchSheetOptimizer({ kerfMm: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Edge trim mm
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={sheetOptimizerSettings.trimMm}
            onChange={(event) =>
              patchSheetOptimizer({ trimMm: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label className="optimizer-toggle">
          <span>Rotate free-grain parts</span>
          <input
            type="checkbox"
            checked={sheetOptimizerSettings.allowRotateFreeGrain}
            onChange={(event) =>
              patchSheetOptimizer({
                allowRotateFreeGrain: event.currentTarget.checked,
              })
            }
          />
        </label>
      </div>

      <div className="report-cost-grid">
        <div className="report-card">
          <span className="report-card-label">Sheets</span>
          <strong>{yieldPlan.totalSheets}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Part area</span>
          <strong>{yieldPlan.totalPartAreaM2.toFixed(2)} m²</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Waste</span>
          <strong>{yieldPlan.totalWasteAreaM2.toFixed(2)} m²</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Reclaimable offcuts</span>
          <strong>{yieldPlan.reclaimableOffcutAreaM2.toFixed(2)} m²</strong>
        </div>
      </div>

      <section className="report-subsection">
        <h3>Yield by material · thickness</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Parts</th>
                <th>Sheets</th>
                <th>Yield</th>
                <th>Waste</th>
                <th>Offcuts</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {yieldPlan.groups.map((group) => (
                <tr key={group.key}>
                  <td>
                    <strong>
                      {group.material} · {group.thicknessMm} mm
                    </strong>
                  </td>
                  <td>{group.partCount}</td>
                  <td>{group.sheetsUsed}</td>
                  <td>{group.yieldPercent}%</td>
                  <td>{group.wasteAreaM2.toFixed(2)} m²</td>
                  <td>{group.reclaimableOffcutAreaM2.toFixed(2)} m²</td>
                  <td>
                    <button
                      type="button"
                      className="shop-source-btn"
                      onClick={() =>
                        setExpandedYieldKey(
                          expandedYieldKey === group.key ? null : group.key,
                        )
                      }
                    >
                      {expandedYieldKey === group.key ? "Hide sheets" : "Sheets"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {yieldPlan.groups
        .filter((group) => group.key === expandedYieldKey)
        .map((group) => (
          <section key={`${group.key}-sheets`} className="report-subsection">
            <h3>
              Cut grouping · {group.material} · {group.thicknessMm} mm
            </h3>
            {group.sheets.map((sheet) => (
              <div key={sheet.label} className="yield-sheet-card">
                <div className="yield-sheet-header">
                  <strong>{sheet.label}</strong>
                  <span>
                    {sheet.parts.length} parts · yield {sheet.yieldPercent}% · waste{" "}
                    {sheet.wasteAreaM2.toFixed(2)} m²
                  </span>
                </div>
                <div className="shop-table-wrap">
                  <table className="shop-table">
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Part</th>
                        <th>Cabinet</th>
                        <th>Pos</th>
                        <th>Size</th>
                        <th>Rot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.parts.map((part) => (
                        <tr key={part.id}>
                          <td>
                            <code className="shop-ref">{part.shopRef}</code>
                          </td>
                          <td>{part.label}</td>
                          <td>{part.cabinetName}</td>
                          <td>
                            {part.xMm},{part.yMm}
                          </td>
                          <td>
                            {part.placedLengthMm}×{part.placedWidthMm}
                          </td>
                          <td>{part.rotated ? "yes" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sheet.offcuts.length > 0 ? (
                  <p className="yield-offcut-note">
                    Offcuts:{" "}
                    {sheet.offcuts
                      .slice(0, 4)
                      .map(
                        (offcut) =>
                          `${offcut.lengthMm}×${offcut.widthMm}${offcut.reclaimable ? "*" : ""}`,
                      )
                      .join(" · ")}
                    {sheet.offcuts.length > 4
                      ? ` · +${sheet.offcuts.length - 4} more`
                      : ""}{" "}
                    (* reclaimable ≥200×200)
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}
