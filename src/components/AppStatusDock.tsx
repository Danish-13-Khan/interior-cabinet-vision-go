import { StatusStrip } from "./StatusStrip";
import { formatJobTitle, clampJobMeta, JOB_STATUS_LABELS } from "../domain/jobMeta";
import { clampCostingSettings, type CostingSettings } from "../domain/costingSettings";
import { clampQuoteSettings, type QuoteSettings } from "../domain/quoteSettings";
import {
  clampSheetOptimizerSettings,
  type SheetOptimizerSettings,
} from "../domain/sheetStock";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import type { ProjectReport } from "../domain/projectReport";
import type { WholeProjectReport } from "../domain/projectRooms";
import type { MachineJobDocument } from "../domain/machineExport";
import type { ReviewNoteSeverity } from "../domain/projectReview";
import { getProjectSheetSet } from "../domain/sheetDocuments";

type AppStatusDockProps = {
  workbenchMode: import("../domain/desktopUx").WorkbenchMode;
  project: CabinetProject;
  projectStatus: string;
  workspaceLabel: string;
  selectedCabinet: CabinetInstance | null;
  selectedCabinetIds: string[];
  validationMessages: string[];
  statusDockOpen: boolean;
  dockHeightPx: number;
  onToggleStatusDock: () => void;
  onDockHeightChange: (heightPx: number) => void;
  onSave: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  report: ProjectReport;
  wholeProject: WholeProjectReport;
  machineJob: MachineJobDocument;
  onExportMachineJson: () => void;
  onExportMachineCsv: () => void;
  selectedCabinetId: string | null;
  costingSettings: CostingSettings;
  quoteSettings: QuoteSettings;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onPreferencePatch: (patch: {
    costing?: CostingSettings;
    quote?: QuoteSettings;
    sheetOptimizer?: SheetOptimizerSettings;
  }) => void;
  onFreezeQuote: () => void;
  onSelectCabinet: (cabinetId: string) => void;
  onFreezeRevision: (note: string, bumpRevision: boolean) => void;
  onAddReviewNote: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveReviewNote: (noteId: string, resolved: boolean) => void;
  onApproveReview: (approvedBy: string) => void;
  onReleaseForProduction: () => void;
  onExportRevisionSummary: () => void;
  approvalBlockedReasons: string[];
  releaseBlockedReasons: string[];
  onOpenSheet?: (sheetId: string) => void;
  hud: import("../domain/desktopUx").ViewportHudState;
  onCycleSnap?: () => void;
  onToggleGrid?: () => void;
};

export function AppStatusDock({
  workbenchMode,
  project,
  projectStatus,
  workspaceLabel,
  selectedCabinet,
  selectedCabinetIds,
  validationMessages,
  statusDockOpen,
  dockHeightPx,
  onToggleStatusDock,
  onDockHeightChange,
  onSave,
  onExportJson,
  onExportCsv,
  onExportPdf,
  report,
  wholeProject,
  machineJob,
  onExportMachineJson,
  onExportMachineCsv,
  selectedCabinetId,
  costingSettings,
  quoteSettings,
  sheetOptimizerSettings,
  onPreferencePatch,
  onFreezeQuote,
  onSelectCabinet,
  onFreezeRevision,
  onAddReviewNote,
  onResolveReviewNote,
  onApproveReview,
  onReleaseForProduction,
  onExportRevisionSummary,
  approvalBlockedReasons,
  releaseBlockedReasons,
  onOpenSheet,
  hud,
  onCycleSnap,
  onToggleGrid,
}: AppStatusDockProps) {
  const job = clampJobMeta(project.job);
  const sheets = getProjectSheetSet(project).sheets;
  const interiorObjectCount = project.interiorDocument?.objects.length ?? 0;
  const selectionSummary = workbenchMode === "interiors"
    ? selectedCabinetIds.length > 0
      ? `${selectedCabinetIds.length} interior object${selectedCabinetIds.length === 1 ? "" : "s"} selected`
      : "No interior selection"
    : selectedCabinet
    ? `${selectedCabinet.config.dimensions.width} × ${selectedCabinet.config.dimensions.height} × ${selectedCabinet.config.dimensions.depth} mm`
    : selectedCabinetIds.length > 1
      ? `${selectedCabinetIds.length} selected`
      : "No selection";

  return (
    <div className="status-dock-shell">
      <StatusStrip
        workbenchMode={workbenchMode}
        projectStatus={projectStatus}
        workspaceLabel={workspaceLabel}
        jobTitle={formatJobTitle(job)}
        jobStatusLabel={JOB_STATUS_LABELS[job.status]}
        cabinetCount={workbenchMode === "interiors" ? interiorObjectCount : project.cabinets.length}
        selectionSummary={selectionSummary}
        validationMessages={validationMessages}
        hud={hud}
        onCycleSnap={onCycleSnap}
        onToggleGrid={onToggleGrid}
        statusDockOpen={statusDockOpen}
        dockHeightPx={dockHeightPx}
        onToggleStatusDock={onToggleStatusDock}
        onDockHeightChange={onDockHeightChange}
        onSave={onSave}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        onExportPdf={onExportPdf}
        report={report}
        wholeProject={wholeProject}
        machineJob={machineJob}
        onExportMachineJson={onExportMachineJson}
        onExportMachineCsv={onExportMachineCsv}
        selectedCabinetId={selectedCabinetId}
        costingSettings={costingSettings}
        quoteSettings={quoteSettings}
        sheetOptimizerSettings={sheetOptimizerSettings}
        onCostingChange={(next) =>
          onPreferencePatch({ costing: clampCostingSettings(next) })
        }
        onQuoteChange={(next) =>
          onPreferencePatch({ quote: clampQuoteSettings(next) })
        }
        onSheetOptimizerChange={(next) =>
          onPreferencePatch({
            sheetOptimizer: clampSheetOptimizerSettings(next),
          })
        }
        onFreezeQuote={onFreezeQuote}
        onSelectCabinet={onSelectCabinet}
        onFreezeRevision={onFreezeRevision}
        onAddReviewNote={onAddReviewNote}
        onResolveReviewNote={onResolveReviewNote}
        onApproveReview={onApproveReview}
        onReleaseForProduction={onReleaseForProduction}
        onExportRevisionSummary={onExportRevisionSummary}
        approvalBlockedReasons={approvalBlockedReasons}
        releaseBlockedReasons={releaseBlockedReasons}
        sheets={sheets}
        onOpenSheet={onOpenSheet}
      />
    </div>
  );
}
