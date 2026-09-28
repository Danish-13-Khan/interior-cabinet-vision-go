import { useState } from "react";
import type {
  CabinetConfig,
  CabinetInstance,
  CabinetProject,
} from "../domain/cabinetDimensions";
import type { CabinetPart } from "../domain/cabinetConstruction";
import type { ManufacturingIssue } from "../domain/manufacturingRules";
import type { ProjectReport } from "../domain/projectReport";
import type { MachineJobDocument } from "../domain/machineExport";
import { buildEngineerDepthChecklist, engineerDepthReadyCount } from "../domain/engineerBridge";
import { EngineeringCabinetViewport } from "./EngineeringCabinetViewport";
import { EngineeringProductionOutputs } from "./EngineeringProductionOutputs";

type ReviewTab = "dimensions" | "construction" | "openings" | "materials" | "validation";
type ViewMode = "3d" | "front" | "plan";

type EngineeringReviewWorkspaceProps = {
  project: CabinetProject;
  cabinet: CabinetInstance | null;
  cabinets: CabinetInstance[];
  report: ProjectReport;
  machineJob: MachineJobDocument | null;
  constructionParts: CabinetPart[];
  manufacturingIssues: ManufacturingIssue[];
  validationMessages: string[];
  releaseBlockedReasons: string[];
  projectStatus: string;
  onSelectCabinet: (cabinetId: string) => void;
  onConfigChange: (config: Partial<CabinetConfig>) => void;
  onOpenAdvanced: () => void;
  onOpenReports: () => void;
  onGoHome: () => void;
  onExportMachineJson: () => void;
  onExportMachineCsv: () => void;
  onFreezeRevision: () => void;
  onReleaseForProduction: () => void;
  onExportCutlist: () => void;
  onExportDrawings: () => void;
};

const REVIEW_TABS: Array<{ id: ReviewTab; label: string }> = [
  { id: "dimensions", label: "Dimensions" },
  { id: "construction", label: "Construction" },
  { id: "openings", label: "Openings" },
  { id: "materials", label: "Materials" },
  { id: "validation", label: "Validation" },
];

function titleCase(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="er-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function DimensionField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  return (
    <label className="er-number-field">
      <span>{label}</span>
      <span><input key={value} type="number" min={1} defaultValue={value} onBlur={(event) => onCommit(Number(event.currentTarget.value))} /><b>mm</b></span>
    </label>
  );
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return <dl className="er-detail-rows">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function EngineeringReviewWorkspace(props: EngineeringReviewWorkspaceProps) {
  const [tab, setTab] = useState<ReviewTab>("dimensions");
  const [view, setView] = useState<ViewMode>("3d");
  const [productionOpen, setProductionOpen] = useState(false);
  const cabinet = props.cabinet ?? props.cabinets[0] ?? null;
  const errors = props.manufacturingIssues.filter((issue) => issue.severity === "error");
  const warnings = props.manufacturingIssues.filter((issue) => issue.severity === "warning");
  const checklist = buildEngineerDepthChecklist({
    handoffSent: true,
    cabinetCount: props.report.summary.cabinetCount,
    cutlistLineCount: props.report.productionCutlist.length,
    hardwareLineCount: props.report.hardwareSchedule.length,
    hasCosting: props.report.projectCost.grandTotal > 0,
    packetReady: props.report.packetSections.length > 0 && !props.report.productionBlocked,
  });
  const progress = engineerDepthReadyCount(checklist);
  const revision = props.project.job?.revision ?? props.report.summary.revision;
  const canRelease = props.releaseBlockedReasons.length === 0 && errors.length === 0;
  const issueMessages = new Set(
    props.manufacturingIssues.map((issue) => issue.message.trim().toLowerCase()),
  );
  const supplementalValidation = props.validationMessages.filter((message) => {
    const normalized = message.replace(/^(warning|error):\s*/i, "").trim().toLowerCase();
    return !issueMessages.has(normalized);
  });

  if (productionOpen) {
    return <EngineeringProductionOutputs
      report={props.report}
      machineJob={props.machineJob}
      onBack={() => setProductionOpen(false)}
      onGoHome={props.onGoHome}
      onExportCutlist={props.onExportCutlist}
      onExportDrawings={props.onExportDrawings}
      onExportMachineJson={props.onExportMachineJson}
      onExportMachineCsv={props.onExportMachineCsv}
    />;
  }

  if (!cabinet) {
    return (
      <section className="engineering-review-workspace">
        <div className="er-empty">
          <strong>No handed-off cabinet selected</strong>
          <span>Return to Interiors and send a production cabinet to Engineering.</span>
          <button type="button" className="er-secondary-action" onClick={props.onGoHome}>Landing page</button>
        </div>
      </section>
    );
  }

  const composition = cabinet.config.composition;
  const construction = cabinet.config.construction;
  const materialRows = Array.from(new Map(
    props.constructionParts.map((part) => [`${part.materialLabel}|${part.thicknessMm}`, part] as const),
  ).values());

  return (
    <section className="engineering-review-workspace" aria-label="Engineering Review">
      <header className="er-header">
        <button type="button" className="er-brand" onClick={props.onGoHome} aria-label="Go to landing page">
          <span className="er-mark">E</span>
          <div><strong>Engineering Review</strong><small>{props.report.summary.projectNumber} · {props.report.summary.customerName}</small></div>
        </button>
        <div className="er-handoff-state"><span>Handoff received</span><strong>Rev {revision}</strong><small>{props.report.summary.cabinetCount} cabinet{props.report.summary.cabinetCount === 1 ? "" : "s"} · {props.report.job.status}</small></div>
        <div className="er-header-actions">
          <button type="button" data-testid="engineering-landing" onClick={props.onGoHome}>Landing page</button>
          <button type="button" onClick={props.onOpenReports}>Reports</button>
          <button type="button" onClick={props.onOpenAdvanced}>Advanced Cabinet Designer</button>
        </div>
      </header>

      <div className="er-progress" aria-label="Engineering readiness">
        <div><span>Engineering readiness</span><strong>{progress.ready} of {progress.total} ready</strong></div>
        <div className="er-progress-track"><i style={{ width: `${(progress.ready / progress.total) * 100}%` }} /></div>
        <small>{errors.length ? `${errors.length} blocking error${errors.length === 1 ? "" : "s"}` : warnings.length ? `${warnings.length} advisory warning${warnings.length === 1 ? "" : "s"}` : "Checks clear"}</small>
      </div>

      <div className="er-layout">
        <aside className="er-cabinet-list">
          <div className="er-section-heading"><span>Handoff cabinets</span><b>{props.cabinets.length}</b></div>
          {props.cabinets.map((item, index) => {
            const selected = item.id === cabinet.id;
            return <button key={item.id} type="button" className={selected ? "is-selected" : ""} data-cabinet-id={item.id} data-cabinet-type={item.config.type} data-display-category={item.displayCategory ?? item.config.type} title={item.displayCategory === "filler" || item.runFiller ? "Run filler" : item.name} onClick={() => props.onSelectCabinet(item.id)}><span className="er-cabinet-mark">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.name}</strong><small>{titleCase(item.config.type)} · {item.config.dimensions.width} × {item.config.dimensions.height} × {item.config.dimensions.depth}</small><em>{item.config.sku ?? item.config.familyId ?? "Production identity"}</em></span><i>{selected ? "Reviewing" : "Open"}</i></button>;
          })}
          <div className="er-checklist">
            <div className="er-section-heading"><span>Output readiness</span></div>
            {checklist.map((item) => <div key={item.id} className={item.ready ? "is-ready" : ""}><i>{item.ready ? "✓" : "·"}</i><span><strong>{item.label}</strong><small>{item.detail}</small></span></div>)}
          </div>
        </aside>

        <main className="er-stage">
          <div className="er-stage-toolbar"><div><strong>{cabinet.name}</strong><small>{cabinet.config.familyId ?? titleCase(cabinet.config.type)} · {cabinet.id}</small></div><nav aria-label="Preview view">{(["3d", "front", "plan"] as ViewMode[]).map((item) => <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>{item === "3d" ? "3D" : titleCase(item)}</button>)}</nav></div>
          <EngineeringCabinetViewport cabinet={cabinet} mode={view} />
          <div className="er-stage-summary"><Metric label="Parts" value={String(props.constructionParts.length)} /><Metric label="Cut-list lines" value={String(props.report.perItemCutlists.find((item) => item.cabinetId === cabinet.id)?.lines.length ?? 0)} /><Metric label="Hardware" value={String(props.report.hardwareByCabinet.find((item) => item.cabinetId === cabinet.id)?.lines.length ?? 0)} /><Metric label="Validation" value={errors.length ? `${errors.length} errors` : warnings.length ? `${warnings.length} warnings` : "Clear"} /></div>
        </main>

        <aside className="er-inspector">
          <nav className="er-tabs" aria-label="Engineering properties">{REVIEW_TABS.map((item) => <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}{item.id === "validation" && (errors.length || warnings.length) ? <b>{errors.length + warnings.length}</b> : null}</button>)}</nav>
          <div className="er-inspector-content">
            {tab === "dimensions" ? <><h2>Cabinet dimensions</h2><p>Manufacturing dimensions for this handed-off cabinet.</p><DimensionField label="Width" value={cabinet.config.dimensions.width} onCommit={(width) => props.onConfigChange({ dimensions: { ...cabinet.config.dimensions, width } })} /><DimensionField label="Height" value={cabinet.config.dimensions.height} onCommit={(height) => props.onConfigChange({ dimensions: { ...cabinet.config.dimensions, height } })} /><DimensionField label="Depth" value={cabinet.config.dimensions.depth} onCommit={(depth) => props.onConfigChange({ dimensions: { ...cabinet.config.dimensions, depth } })} /><DetailRows rows={[["Family", titleCase(cabinet.config.type)], ["Family ID", cabinet.config.familyId ?? "—"], ["SKU", cabinet.config.sku ?? "—"]]} /></> : null}
            {tab === "construction" ? <><h2>Construction</h2><p>Joinery and assembly rules used to generate production parts.</p><DetailRows rows={[["Carcass", titleCase(construction?.carcassStyle ?? "frameless")], ["Case joinery", titleCase(construction?.caseJoinery ?? "butt-screw")], ["Shelf mounting", titleCase(construction?.shelfMount ?? "adjustable-pins")], ["Door mounting", titleCase(construction?.doorMount ?? "overlay")], ["Board thickness", `${cabinet.config.dimensions.boardThickness} mm`], ["Back thickness", `${cabinet.config.dimensions.backPanelThickness} mm`]]} /><h3>Generated parts</h3><div className="er-mini-list">{props.constructionParts.slice(0, 8).map((part) => <div key={part.id}><span>{part.label}</span><b>{part.quantity} × {part.lengthMm} × {part.widthMm}</b></div>)}</div></> : null}
            {tab === "openings" ? <><h2>Openings</h2><p>Front composition inherited from the interior template.</p><DetailRows rows={[["Doors", composition?.doors.enabled ? `${composition.doors.count} · ${titleCase(composition.doors.style)}` : "None"], ["Drawers", String(composition?.drawers.count ?? cabinet.config.drawerCount ?? 0)], ["Shelves", `${composition?.shelves.count ?? cabinet.config.shelfCount} · ${composition?.shelves.adjustable ? "adjustable" : "fixed"}`], ["Dividers", String(composition?.dividers.count ?? 0)], ["Toe kick", composition?.toeKick.enabled ? `${composition.toeKick.heightMm} mm` : "None"]]} /><button type="button" className="er-secondary-action" onClick={props.onOpenAdvanced}>Edit opening layout in Advanced Designer</button></> : null}
            {tab === "materials" ? <><h2>Materials</h2><p>Unique production boards generated for this cabinet.</p><div className="er-material-list">{materialRows.map((part) => <div key={`${part.materialLabel}-${part.thicknessMm}`}><i style={{ background: part.category === "Back" ? "#c9b89d" : "#d8c5a4" }} /><span><strong>{part.materialLabel}</strong><small>{part.thicknessMm} mm · {part.finishLabel} · {part.edgeBandingLabel}</small></span></div>)}</div></> : null}
            {tab === "validation" ? <><h2>Validation</h2><p>Errors block production. Warnings are engineering advisories.</p>{errors.length + warnings.length === 0 && supplementalValidation.length === 0 ? <div className="er-clear-state"><i>✓</i><strong>All checks clear</strong><span>This cabinet is ready for production review.</span></div> : <div className="er-issue-list">{[...errors, ...warnings].map((issue, index) => <div key={`${issue.code}-${index}`} className={`is-${issue.severity}`}><i>{issue.severity === "error" ? "!" : "△"}</i><span><strong>{titleCase(issue.code)}</strong><small>{issue.message}</small></span></div>)}{supplementalValidation.map((message, index) => { const isError = /^error:/i.test(message); return <div key={`validation-${index}`} className={isError ? "is-error" : "is-warning"}><i>{isError ? "!" : "△"}</i><span><strong>Geometry</strong><small>{message.replace(/^(warning|error):\s*/i, "")}</small></span></div>; })}</div>}</> : null}
          </div>
        </aside>
      </div>

      <footer className="er-action-bar">
        <div><strong>{canRelease ? "Ready for production approval" : "Production approval needs attention"}</strong><span>{canRelease ? "All blocking engineering checks are clear." : props.releaseBlockedReasons[0] ?? errors[0]?.message ?? "Resolve the highlighted validation issues."}</span></div>
        <div><button type="button" onClick={props.onExportDrawings}>Export drawings</button><button type="button" onClick={props.onExportCutlist}>Export cut list</button><button type="button" onClick={props.onFreezeRevision}>Freeze revision</button><button type="button" className="is-primary" disabled={!canRelease} onClick={props.onReleaseForProduction}>Approve for Production</button><button type="button" className="is-forward" onClick={() => setProductionOpen(true)}>Production outputs →</button></div>
      </footer>
      {props.projectStatus ? <div className="er-status" role="status">{props.projectStatus}</div> : null}
    </section>
  );
}
