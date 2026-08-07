import type { CostingSettings } from "../domain/costingSettings";
import type { QuoteSettings } from "../domain/quoteSettings";
import type { SheetOptimizerSettings } from "../domain/sheetStock";
import type { ProjectReport } from "../domain/projectReport";
import type { WholeProjectReport } from "../domain/projectRooms";
import type { MachineJobDocument } from "../domain/machineExport";
import { ReportCenter } from "./ReportCenter";

type StatusStripProps = {
  projectStatus: string;
  workspaceLabel: string;
  jobTitle: string;
  jobStatusLabel: string;
  cabinetCount: number;
  selectionSummary: string;
  validationMessages: string[];
  statusDockOpen: boolean;
  onToggleStatusDock: () => void;
  onSave: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  report: ProjectReport;
  selectedCabinetId: string | null;
  costingSettings: CostingSettings;
  quoteSettings: QuoteSettings;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onCostingChange: (next: CostingSettings) => void;
  onQuoteChange: (next: QuoteSettings) => void;
  onSheetOptimizerChange: (next: SheetOptimizerSettings) => void;
  onFreezeQuote: () => void;
  onSelectCabinet: (cabinetId: string) => void;
  wholeProject?: WholeProjectReport | null;
  machineJob?: MachineJobDocument | null;
  onExportMachineJson?: () => void;
  onExportMachineCsv?: () => void;
};

export function StatusStrip({
  projectStatus,
  workspaceLabel,
  jobTitle,
  jobStatusLabel,
  cabinetCount,
  selectionSummary,
  validationMessages,
  statusDockOpen,
  onToggleStatusDock,
  onSave,
  onExportJson,
  onExportCsv,
  onExportPdf,
  report,
  selectedCabinetId,
  costingSettings,
  quoteSettings,
  sheetOptimizerSettings,
  onCostingChange,
  onQuoteChange,
  onSheetOptimizerChange,
  onFreezeQuote,
  onSelectCabinet,
  wholeProject = null,
  machineJob = null,
  onExportMachineJson,
  onExportMachineCsv,
}: StatusStripProps) {
  return (
    <footer className="status-strip">
      <div className="output-bar">
        <span className="output-status">{projectStatus || "Ready"}</span>
        <span className="output-stats">
          {workspaceLabel} · {jobTitle} · {jobStatusLabel} · {cabinetCount} items ·{" "}
          {selectionSummary}
        </span>
        <span className="output-bar-actions">
          <button
            type="button"
            className={`tb-btn ${statusDockOpen ? "tb-accent" : ""}`}
            onClick={onToggleStatusDock}
          >
            {statusDockOpen ? "Hide Reports" : "Reports"}
          </button>
          <button type="button" className="tb-btn" onClick={onSave}>
            Save
          </button>
          <button type="button" className="tb-btn" onClick={onExportJson}>
            JSON
          </button>
          <button type="button" className="tb-btn" onClick={onExportCsv}>
            CSV
          </button>
          <button type="button" className="tb-btn tb-accent" onClick={onExportPdf}>
            PDF
          </button>
        </span>
      </div>
      {validationMessages.length > 0 ? (
        <div className="output-warnings">
          {validationMessages.map((message) => (
            <span
              key={message}
              className={`output-warn ${message.startsWith("Error:") ? "output-warn-error" : ""}`}
            >
              {message}
            </span>
          ))}
        </div>
      ) : null}
      {statusDockOpen ? (
        <div className="status-dock">
          <ReportCenter
            report={report}
            wholeProject={wholeProject}
            machineJob={machineJob}
            onExportMachineJson={onExportMachineJson}
            onExportMachineCsv={onExportMachineCsv}
            selectedCabinetId={selectedCabinetId}
            costingSettings={costingSettings}
            quoteSettings={quoteSettings}
            sheetOptimizerSettings={sheetOptimizerSettings}
            onCostingChange={onCostingChange}
            onQuoteChange={onQuoteChange}
            onSheetOptimizerChange={onSheetOptimizerChange}
            onFreezeQuote={onFreezeQuote}
            onSelectCabinet={onSelectCabinet}
          />
        </div>
      ) : null}
    </footer>
  );
}
