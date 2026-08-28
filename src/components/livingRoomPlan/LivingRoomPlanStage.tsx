import type { InteriorProject, Point3Mm, RenderSettings, RoomDrawingRequest, Size3Mm } from "../../domain/interiorProject";
import type {
  BuildTool,
  LivingRoomAlignMode,
  LivingRoomLightingRecipeId,
  LivingRoomPlanIssue,
  LivingRoomRenderResult,
  LivingRoomStyleId,
  PlanReadabilitySettings,
} from "../../domain/livingRoom";
import { LivingRoomModelView } from "../LivingRoomModelView";
import { LivingRoomPlanView } from "../LivingRoomPlanView";
import { LivingRoomRenderStudio } from "../LivingRoomRenderStudio";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { PlanStageTitlebar } from "./PlanStageTitlebar";
import { PlanStageToolbar } from "./PlanStageToolbar";

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
  exportBlocked: boolean;
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
  activeSurfaceId: string | null;
  surfaceMaterialId: string;
  onSelectWall: (wallId: string) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectSurface: (surfaceId: string | null) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  onMoveNode: (nodeId: string, position: import("../../domain/interiorProject").Point2Mm) => void;
  onTranslateWall: (wallId: string, delta: import("../../domain/interiorProject").Point2Mm) => void;
  activeBuildTool?: BuildTool;
  openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
  onCreateRoom: (drawing: RoomDrawingRequest) => void;
  onDrawSurface: (drawing: RoomDrawingRequest, materialId: string) => void;
  onDrawWallSegment: (start: import("../../domain/interiorProject").Point2Mm, end: import("../../domain/interiorProject").Point2Mm, wallKind?: "wall" | "partition") => void;
  onPlaceColumn: (position: import("../../domain/interiorProject").Point2Mm) => void;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
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
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
};

export function LivingRoomPlanStage(props: LivingRoomPlanStageProps) {
  return (
    <div className="lr-plan-center">
      {props.workspaceView === "plan" ? (
        <PlanStageToolbar canUndo={props.canUndo} canRedo={props.canRedo} hasSelection={props.hasSelection}
          selectedCount={props.selectedIds.length} showGrid={props.showGrid} snapSizeMm={props.snapSizeMm}
          readability={props.readability} onUndo={props.onUndo} onRedo={props.onRedo} onDuplicate={props.onDuplicate}
          onDelete={props.onDelete} onRotate={props.onRotateSelection} onAlign={props.onAlign}
          onCreateRun={props.onCreateCabinetRun} onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize}
          onReadability={props.onReadability} />
      ) : null}
      <PlanStageTitlebar
        project={props.project} workspaceView={props.workspaceView} selectedCount={props.selectedIds.length}
        v2BuildMode={props.v2BuildMode} readability={props.readability} onReadability={props.onReadability}
        exportBusy={props.exportBusy} exportStatus={props.exportStatus}
        millworkCount={props.millworkCount} millworkReady={props.millworkReady} exportBlocked={props.exportBlocked}
        onExportScheduleCsv={props.onExportScheduleCsv} onExportCutlistCsv={props.onExportCutlistCsv}
        onExportPdf={props.onExportPdf}
      />
      <div className="lr-plan-canvas" data-testid="lr-plan-canvas">
        {props.workspaceView === "plan" ? (
          <LivingRoomPlanView
            project={props.project} selectedIds={props.selectedIds} issues={props.issues}
            snapSizeMm={props.snapSizeMm} showGrid={props.showGrid}
            onSelect={props.onSelect} onMove={props.onMove} onResize={props.onResize}
            activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
            activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={props.surfaceMaterialId}
            onSelectWall={props.onSelectWall} onSelectOpening={props.onSelectOpening}
            onSelectSurface={props.onSelectSurface} onMoveOpening={props.onMoveOpening}
            onResizeOpening={props.onResizeOpening} onMoveNode={props.onMoveNode}
            onTranslateWall={props.onTranslateWall} activeBuildTool={props.activeBuildTool}
            openingCatalogItemId={props.openingCatalogItemId} onPlaceOpening={props.onPlaceOpening}
            onCreateRoom={props.onCreateRoom} onDrawSurface={props.onDrawSurface}
            onDrawWallSegment={props.onDrawWallSegment} onPlaceColumn={props.onPlaceColumn}
            roomPolygonCloseRequest={props.roomPolygonCloseRequest}
            onRoomPolygonPointCount={props.onRoomPolygonPointCount} readability={props.readability}
          />
        ) : props.workspaceView === "model" ? (
          <LivingRoomModelView
            project={props.project} selectedIds={props.selectedIds} snapSizeMm={props.snapSizeMm}
            activeOpeningId={props.activeOpeningId} showGrid={props.showGrid}
            onSelect={props.onSelect} onSelectOpening={props.onSelectOpening} onMove={props.onMove}
            onSetRotation={props.onSetRotation} onApplyStyle={props.onApplyStyle}
            onSetParameters={props.onSetParameters}
          />
        ) : (
          <LivingRoomRenderStudio
            project={props.project} latestResult={props.latestRender} previousResult={props.previousRender}
            onRendered={props.onRendered} onSettingsChange={props.onRenderSettingsChange}
            onLightingChange={props.onLightingChange} onBrowserThumbnail={props.onRenderBrowserThumbnail}
          />
        )}
      </div>
      <footer className="lr-plan-status">
        <span>{props.workspaceView === "render" ? "PNG output" : `Snap ${props.snapSizeMm} mm`}</span>
        <span>{props.workspaceView === "plan" ? "Ortho on" : props.workspaceView === "model" ? "Dollhouse ready" : "ACES / sRGB"}</span>
        <span>{props.workspaceView === "render" ? `${props.project.renderSettings.widthPx}×${props.project.renderSettings.heightPx}` : `Grid ${props.showGrid ? "on" : "off"}`}</span>
        {props.v2BuildMode ? <span>mm · Zoom fit</span> : null}
        {props.v2ReviewMode ? <span>Shared 2D / 3D document</span> : null}
        <span className={props.issues.length ? "has-warning" : ""}>
          {props.issues.length ? `${props.issues.length} planning issues` : "Layout checks clear"}
        </span>
        <span className={`lr-autosave-state is-${props.autosaveState}`}>
          {props.autosaveState === "saving"
            ? "Autosaving…"
            : props.autosaveState === "error"
              ? "Autosave failed"
              : props.lastAutosavedAt
                ? `Autosaved ${new Date(props.lastAutosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Autosave ready"}
        </span>
      </footer>
    </div>
  );
}
