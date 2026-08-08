import type { CostingSettings } from "../../domain/costingSettings";
import {
  COSTING_PRESETS,
  getCostingPreset,
} from "../../domain/costingSettings";
import { HARDWARE_CATALOG } from "../../domain/costing";
import type { ProjectReport } from "../../domain/projectReport";
import { money } from "./helpers";

type CostingTabProps = {
  report: ProjectReport;
  costingSettings: CostingSettings;
  onCostingChange: (next: CostingSettings) => void;
  onSelectCabinet?: (cabinetId: string) => void;
};

export function CostingTab({
  report,
  costingSettings,
  onCostingChange,
  onSelectCabinet,
}: CostingTabProps) {
  const hingeOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("hinge-"));
  const slideOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("drawer-slide-"));
  const handleOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("handle-"));

  function patchCosting(patch: Partial<CostingSettings>) {
    onCostingChange({ ...costingSettings, ...patch, presetId: patch.presetId ?? "custom" });
  }

  function applyPreset(presetId: string) {
    const preset = getCostingPreset(presetId);
    if (preset) onCostingChange({ ...preset.settings });
  }

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Costing Summary</strong>
          <span>
            {report.jobTitle} · material, hardware, labour, and allowance
          </span>
        </div>
        <strong>{money(report.projectCost.grandTotal)}</strong>
      </header>

      <div className="costing-controls">
        <label>
          Preset
          <select
            value={
              COSTING_PRESETS.some((preset) => preset.id === costingSettings.presetId)
                ? costingSettings.presetId
                : "custom"
            }
            onChange={(event) => {
              if (event.currentTarget.value === "custom") return;
              applyPreset(event.currentTarget.value);
            }}
          >
            {COSTING_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          Waste %
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={costingSettings.wastePercent}
            onChange={(event) =>
              patchCosting({ wastePercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Labour %
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={costingSettings.labourPercent}
            onChange={(event) =>
              patchCosting({ labourPercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Material rate ×
          <input
            type="number"
            min={0.5}
            max={2}
            step={0.05}
            value={costingSettings.materialRateMultiplier}
            onChange={(event) =>
              patchCosting({
                materialRateMultiplier: Number(event.currentTarget.value),
              })
            }
          />
        </label>
        <label>
          Hardware allowance
          <input
            type="number"
            min={0}
            step={100}
            value={costingSettings.hardwareAllowance}
            onChange={(event) =>
              patchCosting({ hardwareAllowance: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Labour allowance
          <input
            type="number"
            min={0}
            step={100}
            value={costingSettings.labourAllowance}
            onChange={(event) =>
              patchCosting({ labourAllowance: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Finish rate ×
          <input
            type="number"
            min={0.5}
            max={2}
            step={0.05}
            value={costingSettings.finishRateMultiplier}
            onChange={(event) =>
              patchCosting({
                finishRateMultiplier: Number(event.currentTarget.value),
              })
            }
          />
        </label>
        <label>
          Hinge
          <select
            value={costingSettings.hingeId}
            onChange={(event) => patchCosting({ hingeId: event.currentTarget.value })}
          >
            {hingeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} (₹{item.costPerUnit})
              </option>
            ))}
          </select>
        </label>
        <label>
          Drawer slide
          <select
            value={costingSettings.drawerSlideId}
            onChange={(event) =>
              patchCosting({ drawerSlideId: event.currentTarget.value })
            }
          >
            {slideOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} (₹{item.costPerUnit})
              </option>
            ))}
          </select>
        </label>
        <label>
          Handle
          <select
            value={costingSettings.handleId}
            onChange={(event) => patchCosting({ handleId: event.currentTarget.value })}
          >
            {handleOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} (₹{item.costPerUnit})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="report-cost-grid">
        <div className="report-card">
          <span className="report-card-label">Material</span>
          <strong>{money(report.projectCost.totalMaterial)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Waste included</span>
          <strong>{money(report.projectCost.totalWaste)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Hardware</span>
          <strong>{money(report.projectCost.totalHardware)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Labour</span>
          <strong>{money(report.projectCost.totalLabour)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Finish</span>
          <strong>{money(report.projectCost.totalFinish)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">HW allowance</span>
          <strong>{money(report.projectCost.hardwareAllowance)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Labour allowance</span>
          <strong>{money(report.projectCost.labourAllowance)}</strong>
        </div>
      </div>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Mark</th>
              <th>Cabinet</th>
              <th>Material</th>
              <th>Finish</th>
              <th>Hardware</th>
              <th>Labour</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {report.projectCost.cabinets.map((cost, index) => {
              const mark =
                report.cabinetSchedule.find((row) => row.cabinetId === cost.cabinetId)
                  ?.mark ?? `C${String(index + 1).padStart(2, "0")}`;
              return (
                <tr key={cost.cabinetId}>
                  <td>
                    <code className="shop-ref">{mark}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="shop-source-btn"
                      onClick={() => onSelectCabinet?.(cost.cabinetId)}
                    >
                      {cost.cabinetName}
                    </button>
                  </td>
                  <td>{money(cost.materialCost)}</td>
                  <td>{money(cost.finishCost)}</td>
                  <td>{money(cost.hardwareCost)}</td>
                  <td>{money(cost.labourCost)}</td>
                  <td>
                    <strong>{money(cost.totalCost)}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
