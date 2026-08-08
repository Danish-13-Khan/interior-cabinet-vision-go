import { useState } from "react";
import type { CostingSettings } from "../domain/costingSettings";
import type { ProjectReport } from "../domain/projectReport";
import type { QuoteSettings } from "../domain/quoteSettings";
import type { SheetOptimizerSettings } from "../domain/sheetStock";
import type { WholeProjectReport } from "../domain/projectRooms";
import type { MachineJobDocument } from "../domain/machineExport";
import type { ReviewNoteSeverity } from "../domain/projectReview";
import { WholeProjectRoomsPanel } from "./WholeProjectRoomsPanel";
import { MachiningPreviewPanel } from "./machineExport/MachiningPreviewPanel";
import { ReviewWorkflowPanel } from "./ReviewWorkflowPanel";
import { PacketTab } from "./reportCenter/PacketTab";
import { ScheduleTab } from "./reportCenter/ScheduleTab";
import { RunsTab } from "./reportCenter/RunsTab";
import { MaterialsTab } from "./reportCenter/MaterialsTab";
import { OptimizeTab } from "./reportCenter/OptimizeTab";
import { HardwareTab } from "./reportCenter/HardwareTab";
import { CutlistTab } from "./reportCenter/CutlistTab";
import { CostingTab } from "./reportCenter/CostingTab";
import { QuoteTab } from "./reportCenter/QuoteTab";

export type ReportCenterTab =
  | "packet"
  | "rooms"
  | "schedule"
  | "runs"
  | "materials"
  | "optimize"
  | "hardware"
  | "cutlist"
  | "machining"
  | "costing"
  | "quote"
  | "review";

type ReportCenterProps = {
  report: ProjectReport;
  wholeProject?: WholeProjectReport | null;
  machineJob?: MachineJobDocument | null;
  onExportMachineJson?: () => void;
  onExportMachineCsv?: () => void;
  selectedCabinetId?: string | null;
  costingSettings: CostingSettings;
  quoteSettings: QuoteSettings;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onCostingChange: (next: CostingSettings) => void;
  onQuoteChange: (next: QuoteSettings) => void;
  onSheetOptimizerChange: (next: SheetOptimizerSettings) => void;
  onFreezeQuote?: () => void;
  onSelectCabinet?: (cabinetId: string) => void;
  onFreezeRevision?: (note: string, bumpRevision: boolean) => void;
  onAddReviewNote?: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveReviewNote?: (noteId: string, resolved: boolean) => void;
  onApproveReview?: (approvedBy: string) => void;
  onReleaseForProduction?: () => void;
  onExportRevisionSummary?: () => void;
  approvalBlockedReasons?: string[];
  releaseBlockedReasons?: string[];
};

const TABS = [
  ["packet", "Packet"],
  ["review", "Review"],
  ["rooms", "Rooms"],
  ["schedule", "Schedule"],
  ["runs", "Runs"],
  ["materials", "Materials"],
  ["optimize", "Optimize"],
  ["hardware", "Hardware"],
  ["cutlist", "Cutlist"],
  ["machining", "Machining"],
  ["costing", "Costing"],
  ["quote", "Quote"],
] as const satisfies ReadonlyArray<readonly [ReportCenterTab, string]>;

export function ReportCenter({
  report,
  wholeProject = null,
  machineJob = null,
  onExportMachineJson,
  onExportMachineCsv,
  selectedCabinetId = null,
  costingSettings,
  quoteSettings,
  sheetOptimizerSettings,
  onCostingChange,
  onQuoteChange,
  onSheetOptimizerChange,
  onFreezeQuote,
  onSelectCabinet,
  onFreezeRevision,
  onAddReviewNote,
  onResolveReviewNote,
  onApproveReview,
  onReleaseForProduction,
  onExportRevisionSummary,
  approvalBlockedReasons = [],
  releaseBlockedReasons = [],
}: ReportCenterProps) {
  const [tab, setTab] = useState<ReportCenterTab>("packet");

  return (
    <div className="report-center">
      <div className="report-center-tabs" role="tablist" aria-label="Production packet">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`report-center-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="report-center-body">
        {tab === "packet" ? <PacketTab report={report} /> : null}

        {tab === "review" ? (
          <ReviewWorkflowPanel
            review={report.review}
            currentFingerprint={report.currentFingerprint}
            onFreezeRevision={(note, bump) => onFreezeRevision?.(note, bump)}
            onAddNote={(message, severity) => onAddReviewNote?.(message, severity)}
            onResolveNote={(noteId, resolved) =>
              onResolveReviewNote?.(noteId, resolved)
            }
            onApprove={(name) => onApproveReview?.(name)}
            onRelease={() => onReleaseForProduction?.()}
            onExportRevisionSummary={() => onExportRevisionSummary?.()}
            approvalBlockedReasons={approvalBlockedReasons}
            releaseBlockedReasons={releaseBlockedReasons}
          />
        ) : null}

        {tab === "rooms" ? (
          wholeProject ? (
            <WholeProjectRoomsPanel wholeProject={wholeProject} />
          ) : (
            <div className="report-doc">
              <p className="rail-empty">Whole-project room data is unavailable.</p>
            </div>
          )
        ) : null}

        {tab === "schedule" ? (
          <ScheduleTab report={report} onSelectCabinet={onSelectCabinet} />
        ) : null}

        {tab === "runs" ? <RunsTab report={report} /> : null}

        {tab === "materials" ? <MaterialsTab report={report} /> : null}

        {tab === "optimize" ? (
          <OptimizeTab
            report={report}
            sheetOptimizerSettings={sheetOptimizerSettings}
            onSheetOptimizerChange={onSheetOptimizerChange}
          />
        ) : null}

        {tab === "hardware" ? (
          <HardwareTab report={report} onSelectCabinet={onSelectCabinet} />
        ) : null}

        {tab === "cutlist" ? (
          <CutlistTab
            report={report}
            selectedCabinetId={selectedCabinetId}
            onSelectCabinet={onSelectCabinet}
          />
        ) : null}

        {tab === "machining" ? (
          machineJob ? (
            <MachiningPreviewPanel
              document={machineJob}
              onExportJson={onExportMachineJson}
              onExportCsv={onExportMachineCsv}
            />
          ) : (
            <div className="report-doc">
              <p className="rail-empty">
                Machining preview unavailable. Machine export is intent-only and does not
                produce CNC programs.
              </p>
            </div>
          )
        ) : null}

        {tab === "costing" ? (
          <CostingTab
            report={report}
            costingSettings={costingSettings}
            onCostingChange={onCostingChange}
            onSelectCabinet={onSelectCabinet}
          />
        ) : null}

        {tab === "quote" ? (
          <QuoteTab
            report={report}
            quoteSettings={quoteSettings}
            onQuoteChange={onQuoteChange}
            onFreezeQuote={onFreezeQuote}
            onSelectCabinet={onSelectCabinet}
          />
        ) : null}
      </div>
    </div>
  );
}
