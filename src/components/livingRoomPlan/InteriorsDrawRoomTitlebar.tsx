import {
  INTERIORS_DRAW_ROOM_NAV_TOOLS,
  interiorsDrawRoomHint,
  type InteriorsChromeTool,
} from "../../domain/desktopUx";
import type { InteriorProject } from "../../domain/interiorProject";
import type { BuildTool, PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanOnDemandChrome } from "./PlanOnDemandChrome";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";
import { PlanPrintExportControls } from "./PlanPrintExportControls";
import type { InteriorsDrawRoomCommands } from "./interiorsDrawRoomCommands";

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
  onZoomIn,
  onZoomOut,
  hasSelection,
  commands,
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  hasSelection?: boolean;
  commands: InteriorsDrawRoomCommands;
}) {
  return (
    <div className="lr-draw-titlebar lr-plan-titlebar has-readability" data-testid="interiors-draw-titlebar">
      <p className="lr-plan-title-copy">
        <strong>Room plan</strong>
        <span className="lr-plan-title-sep" aria-hidden>·</span>
        <span className="lr-draw-project-name">{project.name}</span>
        <span className="lr-plan-title-sep" aria-hidden>·</span>
        <span className="lr-plan-title-hint">{interiorsDrawRoomHint(tool, buildTool)}</span>
      </p>
      <div className="lr-plan-title-actions">
        <div className="lr-plan-primary-tools" role="group" aria-label="Plan authoring tools">
          {INTERIORS_DRAW_ROOM_NAV_TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-build-tool={item.id}
              className={buildTool === item.id ? "is-active" : ""}
              onClick={() => commands.onBuildTool(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <PlanOnDemandChrome
          layers={<PlanReadabilityToolbar settings={readability} onChange={onReadability} />}
          exportPanel={<PlanPrintExportControls project={project} onPatchDocument={onPatchDocument} />}
        />
        <div className="lr-plan-view-tools" role="group" aria-label="Plan view">
          <span className="lr-plan-units">Units: {readability.unit}</span>
          <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => onZoomOut?.()}>−</button>
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => onZoomIn?.()}>+</button>
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
    </div>
  );
}
