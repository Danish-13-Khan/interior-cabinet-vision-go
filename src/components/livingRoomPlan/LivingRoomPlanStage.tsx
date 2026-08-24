import type { InteriorProject, Point3Mm, RenderSettings, Size3Mm } from "../../domain/interiorProject";
import type {
  LivingRoomAlignMode,
  LivingRoomLightingRecipeId,
  LivingRoomPlanIssue,
  LivingRoomRenderResult,
  LivingRoomStyleId,
} from "../../domain/livingRoom";
import { LivingRoomModelView } from "../LivingRoomModelView";
import { LivingRoomPlanView } from "../LivingRoomPlanView";
import { LivingRoomRenderStudio } from "../LivingRoomRenderStudio";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { MillworkScheduleActions } from "./millworkSchedule";

type LivingRoomPlanStageProps = {
  project: InteriorProject;
  workspaceView: LivingRoomWorkspaceView;
  selectedIds: string[];
  issues: LivingRoomPlanIssue[];
  snapSizeMm: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  millworkCount: number;
  millworkReady: boolean;
  exportBusy: boolean;
  exportStatus: string;
  autosaveState: "idle" | "saving" | "saved" | "error";
  lastAutosavedAt: string | null;
  latestRender: LivingRoomRenderResult | null;
  previousRender: LivingRoomRenderResult | null;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onSelectWall: (wallId: string) => void;
  onSelectOpening: (openingId: string) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelection: (delta: number) => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onCreateCabinetRun: () => void;
  onRenderSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
  onRenderBrowserThumbnail?: (dataUrl: string) => void;
  onRendered: (result: LivingRoomRenderResult) => void;
  onExportScheduleCsv: () => void;
  onExportCutlistCsv: () => void;
  onExportPdf: () => void;
  v2BuildMode?: boolean;
  v2ReviewMode?: boolean;
};

export function LivingRoomPlanStage(props: LivingRoomPlanStageProps) {
  return (
    <div className="lr-plan-center">
      {props.workspaceView === "plan" ? (
        <header className="lr-plan-toolbar">
          <div className="lr-toolbar-group">
            <span>Edit</span>
            <button type="button" aria-label="Undo" title="Undo" onClick={props.onUndo} disabled={!props.canUndo}>↶</button>
            <button type="button" aria-label="Redo" title="Redo" onClick={props.onRedo} disabled={!props.canRedo}>↷</button>
            <button type="button" aria-label="Duplicate" title="Duplicate" onClick={props.onDuplicate} disabled={!props.hasSelection}>⧉</button>
            <button type="button" aria-label="Delete" title="Delete" onClick={props.onDelete} disabled={!props.hasSelection}>⌫</button>
          </div>
          <div className="lr-toolbar-group">
            <span>Transform</span>
            <button type="button" title="Rotate left 90°" onClick={() => props.onRotateSelection(-90)} disabled={!props.hasSelection}>−90°</button>
            <button type="button" title="Rotate right 90°" onClick={() => props.onRotateSelection(90)} disabled={!props.hasSelection}>+90°</button>
          </div>
          <div className="lr-toolbar-group">
            <span>Align</span>
            <button type="button" title="Align left" onClick={() => props.onAlign("left")} disabled={props.selectedIds.length < 2}>L</button>
            <button type="button" title="Align centers" onClick={() => props.onAlign("center-x")} disabled={props.selectedIds.length < 2}>C</button>
            <button type="button" title="Align middles" onClick={() => props.onAlign("center-z")} disabled={props.selectedIds.length < 2}>M</button>
            <button type="button" title="Distribute" onClick={() => props.onAlign("distribute-x")} disabled={props.selectedIds.length < 3}>↔</button>
            <button type="button" title="Create cabinet run on selected wall" onClick={props.onCreateCabinetRun} disabled={props.selectedIds.length < 2}>Run</button>
          </div>
          <div className="lr-toolbar-group lr-toolbar-view">
            <span>Drawing</span>
            <label>
              <input type="checkbox" checked={props.showGrid} onChange={(event) => props.onShowGrid(event.target.checked)} /> Grid
            </label>
            <select value={props.snapSizeMm} onChange={(event) => props.onSnapSize(Number(event.target.value))}>
              <option value="25">25 mm</option>
              <option value="50">50 mm</option>
              <option value="100">100 mm</option>
            </select>
          </div>
        </header>
      ) : null}
      <div className={`lr-plan-titlebar${props.workspaceView === "model" ? " is-model-presence" : ""}`}>
        <strong>
          {props.workspaceView === "model"
            ? "MODEL"
            : props.workspaceView === "render"
              ? "RENDER · LIVING ROOM"
              : "PLAN · LIVING ROOM"}
        </strong>
        <span>
          {props.workspaceView === "model"
            ? `${props.project.name} · staged concept`
            : `${props.project.name} · ${props.project.objects.length} objects · ${props.selectedIds.length} selected`}
        </span>
        {props.workspaceView !== "model" ? (
          <small>
            {props.workspaceView === "plan" ? "Scale: Fit" : "Presentation Output"} · Units: mm
          </small>
        ) : (
          <small>Eye-level · Units: mm</small>
        )}
        {props.workspaceView !== "render" ? (
          <MillworkScheduleActions
            busy={props.exportBusy}
            status={props.exportStatus}
            disabled={false}
            millworkCount={props.millworkCount}
            readyToExport={props.millworkReady}
            onExportScheduleCsv={props.onExportScheduleCsv}
            onExportCutlistCsv={props.onExportCutlistCsv}
            onExportPdf={props.onExportPdf}
          />
        ) : null}
      </div>
      <div className="lr-plan-canvas" data-testid="lr-plan-canvas">
        {props.workspaceView === "plan" ? (
          <LivingRoomPlanView
            project={props.project}
            selectedIds={props.selectedIds}
            issues={props.issues}
            snapSizeMm={props.snapSizeMm}
            showGrid={props.showGrid}
            onSelect={props.onSelect}
            onMove={props.onMove}
            onResize={props.onResize}
            activeWallId={props.activeWallId}
            activeOpeningId={props.activeOpeningId}
            onSelectWall={props.onSelectWall}
            onSelectOpening={props.onSelectOpening}
          />
        ) : props.workspaceView === "model" ? (
          <LivingRoomModelView
            project={props.project}
            selectedIds={props.selectedIds}
            snapSizeMm={props.snapSizeMm}
            showGrid={props.showGrid}
            onSelect={props.onSelect}
            onMove={props.onMove}
            onSetRotation={props.onSetRotation}
            onApplyStyle={props.onApplyStyle}
            onSetParameters={props.onSetParameters}
          />
        ) : (
          <LivingRoomRenderStudio
            project={props.project}
            latestResult={props.latestRender}
            previousResult={props.previousRender}
            onRendered={props.onRendered}
            onSettingsChange={props.onRenderSettingsChange}
            onLightingChange={props.onLightingChange}
            onBrowserThumbnail={props.onRenderBrowserThumbnail}
          />
        )}
      </div>
      <footer className="lr-plan-status">
        <span>{props.workspaceView === "render" ? "OUTPUT PNG" : `SNAP ${props.snapSizeMm} mm`}</span>
        <span>{props.workspaceView === "plan" ? "ORTHO ON" : props.workspaceView === "model" ? "ORBIT READY" : "ACES / SRGB"}</span>
        <span>{props.workspaceView === "render" ? `${props.project.renderSettings.widthPx}×${props.project.renderSettings.heightPx}` : `GRID ${props.showGrid ? "ON" : "OFF"}`}</span>
        {props.v2BuildMode ? <span>UNITS mm · ZOOM FIT</span> : null}
        {props.v2ReviewMode ? <span>2D / 3D SHARED DOCUMENT</span> : null}
        <span className={props.issues.length ? "has-warning" : ""}>
          {props.issues.length ? `${props.issues.length} planning issues` : "Layout checks clear"}
        </span>
        <span className={`lr-autosave-state is-${props.autosaveState}`}>
          {props.autosaveState === "saving"
            ? "AUTOSAVING…"
            : props.autosaveState === "error"
              ? "AUTOSAVE FAILED"
              : props.lastAutosavedAt
                ? `AUTOSAVED ${new Date(props.lastAutosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "AUTOSAVE READY"}
        </span>
      </footer>
    </div>
  );
}
