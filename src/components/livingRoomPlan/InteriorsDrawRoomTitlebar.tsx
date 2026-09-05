import { interiorsDrawRoomHint, type InteriorsChromeTool } from "../../domain/desktopUx";
import type { InteriorProject } from "../../domain/interiorProject";
import type { BuildTool, PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";
import { PlanPrintExportControls } from "./PlanPrintExportControls";

export function InteriorsDrawRoomTitlebar({
  project,
  tool,
  buildTool,
  showGrid,
  snapSizeMm,
  readability,
  onPatchDocument,
  onShowGrid,
  onSnapSize,
  onReadability,
  onFitPlan,
  onFitSelection,
  hasSelection,
}: {
  project: InteriorProject;
  tool: InteriorsChromeTool;
  buildTool?: BuildTool;
  showGrid: boolean;
  snapSizeMm: number;
  readability: PlanReadabilitySettings;
  onPatchDocument: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
  onFitPlan?: () => void;
  onFitSelection?: () => void;
  hasSelection?: boolean;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar has-readability" data-testid="interiors-draw-titlebar">
      <span>
        <strong>Room plan</strong>
        {" · "}
        <span className="lr-draw-project-name">{project.name}</span>
        {" · "}
        {interiorsDrawRoomHint(tool, buildTool)}
      </span>
      <PlanReadabilityToolbar settings={readability} onChange={onReadability} />
      <PlanPrintExportControls project={project} onPatchDocument={onPatchDocument} />
      <small>Units: {readability.unit}</small>
      <div>
        <button type="button" data-testid="fit-plan" title="Fit plan" onClick={() => onFitPlan?.()}>Fit</button>
        <button type="button" data-testid="fit-selection" title="Fit selection" onClick={() => onFitSelection?.()} disabled={!hasSelection}>Fit sel</button>
        <button type="button" className={showGrid ? "is-active" : ""} aria-pressed={showGrid} onClick={() => onShowGrid(!showGrid)}>
          Grid
        </button>
        <select aria-label="Snap size" value={snapSizeMm} onChange={(event) => onSnapSize(Number(event.target.value))}>
          <option value="25">Snap 25 mm</option>
          <option value="50">Snap 50 mm</option>
          <option value="100">Snap 100 mm</option>
        </select>
      </div>
    </div>
  );
}
