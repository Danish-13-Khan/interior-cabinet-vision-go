import { useEffect, useMemo, useRef, useState } from "react";
import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  RenderSettings,
  Size3Mm,
} from "../domain/interiorProject";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import {
  LIVING_ROOM_CATALOG,
  getLivingRoomPlanUnderlay,
  type LivingRoomAlignMode,
  type LivingRoomCatalogId,
  type LivingRoomLightingRecipeId,
  type LivingRoomPlanIssue,
  type LivingRoomPlanUnderlay,
  type LivingRoomRenderResult,
  type LivingRoomRecoverySnapshot,
  type LivingRoomStyleId,
} from "../domain/livingRoom";
import { LivingRoomModelView } from "./LivingRoomModelView";
import { LivingRoomPlanView } from "./LivingRoomPlanView";
import { LivingRoomRenderStudio } from "./LivingRoomRenderStudio";
import { LivingRoomProjectHome } from "./LivingRoomProjectHome";
import type { WorkbenchMode } from "../domain/desktopUx";

type LivingRoomWorkspaceView = "plan" | "model" | "render";

type LivingRoomPlanWorkspaceProps = {
  project: InteriorProject | null;
  selectedIds: string[];
  selectedObjects: InteriorObjectEntity[];
  issues: LivingRoomPlanIssue[];
  canUndo: boolean;
  canRedo: boolean;
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  toolRailWidthPx: number;
  inspectorWidthPx: number;
  projectHomeOpen: boolean;
  isDirty: boolean;
  autosaveState: "idle" | "saving" | "saved" | "error";
  lastAutosavedAt: string | null;
  recovery: LivingRoomRecoverySnapshot | null;
  recentProjects: SavedProjectBrowserEntry[];
  onCreateStarter: (options?: { projectName?: string; styleId?: LivingRoomStyleId }) => void;
  onOpenDemo: () => void;
  onOpenProjectHome: () => void;
  onCloseProjectHome: () => void;
  onOpenRecentProject: (projectId: string) => void;
  onDeleteRecentProject: (projectId: string) => void;
  onRestoreRecovery: () => void;
  onDiscardRecovery: () => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onRotateSelection: (deltaDegrees: number) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onNudge: (dx: number, dz: number) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onRenderSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
  onRenderBrowserThumbnail?: (dataUrl: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onWorkbenchModeChange: (mode: WorkbenchMode) => void;
};

type StudioPanel = "assets" | "layers" | "underlay";

function imageFileToUnderlay(
  file: File,
  roomWidthMm: number,
): Promise<LivingRoomPlanUnderlay> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported plan image."));
      image.onload = () => resolve({
        fileName: file.name,
        dataUrl,
        widthMm: roomWidthMm,
        heightMm: roomWidthMm * image.naturalHeight / Math.max(1, image.naturalWidth),
        opacity: 0.42,
      });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function ProductIcon({ name }: { name: "home" | "folder" | "undo" | "redo" | "save" }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
    folder: <path d="M3 6.5h7l2-2h9v15H3z"/>,
    undo: <><path d="m9 7-5 5 5 5"/><path d="M5 12h8.5a6 6 0 0 1 6 6"/></>,
    redo: <><path d="m15 7 5 5-5 5"/><path d="M19 12h-8.5a6 6 0 0 0-6 6"/></>,
    save: <><path d="M4 3h13l3 3v15H4z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function InteriorsProductHeader({
  projectName,
  workspaceView,
  isDirty,
  canUndo,
  canRedo,
  onProject,
  onView,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onWorkbenchModeChange,
}: {
  projectName: string | null;
  workspaceView: LivingRoomWorkspaceView;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onProject: () => void;
  onView: (view: LivingRoomWorkspaceView) => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onWorkbenchModeChange: (mode: WorkbenchMode) => void;
}) {
  return (
    <header className="lr-product-header">
      <button type="button" className="lr-product-brand" onClick={onProject}>
        <span className="lr-product-mark"><i /><i /><i /></span>
        <span><strong>Interiors</strong><small>{projectName ?? "Living room studio"}</small></span>
      </button>
      <nav className="lr-product-nav" aria-label="Interiors workflow">
        <button type="button" aria-label="Home" onClick={onProject}><ProductIcon name="home" />Project</button>
        {(["plan", "model", "render"] as const).map((view) => (
          <button
            type="button"
            key={view}
            className={workspaceView === view ? "is-active" : ""}
            onClick={() => onView(view)}
            disabled={!projectName}
          >
            <span className="lr-nav-index">{view === "plan" ? "2D" : view === "model" ? "3D" : "FX"}</span>
            {view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
        <button type="button" onClick={onExport} disabled={!projectName}><span className="lr-nav-index">OUT</span>Export</button>
      </nav>
      <div className="lr-product-actions">
        <button type="button" className="lr-icon-button" aria-label="Open project" title="Open project" onClick={onOpen}><ProductIcon name="folder" /></button>
        <button type="button" className="lr-icon-button" aria-label="Undo" title="Undo" onClick={onUndo} disabled={!canUndo}><ProductIcon name="undo" /></button>
        <button type="button" className="lr-icon-button" aria-label="Redo" title="Redo" onClick={onRedo} disabled={!canRedo}><ProductIcon name="redo" /></button>
        <button type="button" className="lr-save-button" onClick={onSave} disabled={!projectName}><ProductIcon name="save" />{isDirty ? "Save *" : "Save"}</button>
        <label className="lr-workspace-picker">
          <span>Workspace</span>
          <select value="interiors" onChange={(event) => onWorkbenchModeChange(event.target.value as WorkbenchMode)}>
            <option value="interiors">Interiors</option>
            <option value="job">Job</option>
            <option value="room">Room</option>
            <option value="cabinets">Cabinets</option>
            <option value="drawings">Drawings</option>
            <option value="production">Production</option>
            <option value="reports">Reports</option>
          </select>
        </label>
      </div>
    </header>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);

  function commit() {
    const next = Number(draft);
    if (draft.trim() && Number.isFinite(next)) onChange(next);
    else setDraft(String(Math.round(value)));
  }

  return (
    <label className="lr-number-field">
      <span>{label}</span>
      <input
        type="number"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(Math.round(value)));
            event.currentTarget.blur();
          }
        }}
      />
      <small>mm</small>
    </label>
  );
}

export function LivingRoomPlanWorkspace(props: LivingRoomPlanWorkspaceProps) {
  const [snapSizeMm, setSnapSizeMm] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [workspaceView, setWorkspaceView] = useState<LivingRoomWorkspaceView>("plan");
  const [studioPanel, setStudioPanel] = useState<StudioPanel>("assets");
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [importError, setImportError] = useState("");
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const [renderResults, setRenderResults] = useState<{
    latest: LivingRoomRenderResult | null;
    previous: LivingRoomRenderResult | null;
  }>({ latest: null, previous: null });
  const activeObject = props.selectedObjects[0] ?? null;
  const room = props.project?.rooms.find(
    (item) => item.id === props.project?.activeRoomId,
  );
  const underlay = props.project ? getLivingRoomPlanUnderlay(props.project) : null;
  const assetCategories = useMemo(
    () => ["all", ...new Set(LIVING_ROOM_CATALOG.map((item) => item.category))],
    [],
  );
  const visibleAssets = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    return LIVING_ROOM_CATALOG.filter((item) =>
      (assetCategory === "all" || item.category === assetCategory) &&
      (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)),
    );
  }, [assetCategory, assetQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (props.projectHomeOpen) return;
      if (event.key === "1") {
        event.preventDefault();
        setWorkspaceView("plan");
        return;
      }
      if (event.key === "2") {
        event.preventDefault();
        setWorkspaceView("model");
        return;
      }
      if (event.key === "3") {
        event.preventDefault();
        setWorkspaceView("render");
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        props.onDuplicate();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        props.onDelete();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        props.onRotateSelection(event.shiftKey ? -90 : 90);
        return;
      }
      const amount = event.shiftKey ? snapSizeMm * 5 : snapSizeMm;
      if (event.key === "ArrowLeft") props.onNudge(-amount, 0);
      if (event.key === "ArrowRight") props.onNudge(amount, 0);
      if (event.key === "ArrowUp") props.onNudge(0, -amount);
      if (event.key === "ArrowDown") props.onNudge(0, amount);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props, snapSizeMm]);

  useEffect(() => {
    setRenderResults({ latest: null, previous: null });
  }, [props.project?.id]);

  if (!props.project || !room) {
    return (
      <section className="lr-plan-shell lr-product-shell">
        <InteriorsProductHeader
          projectName={null}
          workspaceView={workspaceView}
          isDirty={props.isDirty}
          canUndo={props.canUndo}
          canRedo={props.canRedo}
          onProject={props.onOpenProjectHome}
          onView={setWorkspaceView}
          onOpen={props.onOpenProject}
          onSave={props.onSaveProject}
          onExport={props.onExportProject}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onWorkbenchModeChange={props.onWorkbenchModeChange}
        />
        <div className="lr-empty-workspace">
          <LivingRoomProjectHome
            open
            hasCurrentProject={false}
            isDirty={props.isDirty}
            recentProjects={props.recentProjects}
            recovery={props.recovery}
            onClose={props.onCloseProjectHome}
            onCreate={(options) => props.onCreateStarter(options)}
            onOpenDemo={props.onOpenDemo}
            onOpenRecent={props.onOpenRecentProject}
            onDeleteRecent={props.onDeleteRecentProject}
            onRestoreRecovery={props.onRestoreRecovery}
            onDiscardRecovery={props.onDiscardRecovery}
          />
        </div>
      </section>
    );
  }

  function patchPosition(axis: keyof Point3Mm, value: number) {
    if (!activeObject) return;
    props.onMove(activeObject.id, { ...activeObject.position, [axis]: value });
  }

  function patchDimensions(axis: keyof Size3Mm, value: number) {
    if (!activeObject) return;
    props.onResize(activeObject.id, { ...activeObject.dimensions, [axis]: value });
  }

  async function importUnderlay(file: File | null) {
    if (!file || !room) return;
    setImportError("");
    try {
      props.onSetPlanUnderlay(await imageFileToUnderlay(file, room.dimensions.widthMm));
      setStudioPanel("underlay");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Plan import failed.");
    } finally {
      if (underlayInputRef.current) underlayInputRef.current.value = "";
    }
  }

  return (
    <section className="lr-plan-shell lr-product-shell">
      <InteriorsProductHeader
        projectName={props.project.name}
        workspaceView={workspaceView}
        isDirty={props.isDirty}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        onProject={props.onOpenProjectHome}
        onView={setWorkspaceView}
        onOpen={props.onOpenProject}
        onSave={props.onSaveProject}
        onExport={props.onExportProject}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        onWorkbenchModeChange={props.onWorkbenchModeChange}
      />
      <div className={`lr-workspace-body is-${workspaceView}`}>
        <LivingRoomProjectHome
        open={props.projectHomeOpen}
        hasCurrentProject
        isDirty={props.isDirty}
        recentProjects={props.recentProjects}
        recovery={props.recovery}
        onClose={props.onCloseProjectHome}
        onCreate={(options) => props.onCreateStarter(options)}
        onOpenDemo={props.onOpenDemo}
        onOpenRecent={(projectId) => {
          props.onOpenRecentProject(projectId);
          props.onCloseProjectHome();
        }}
        onDeleteRecent={props.onDeleteRecentProject}
        onRestoreRecovery={props.onRestoreRecovery}
        onDiscardRecovery={props.onDiscardRecovery}
      />
      {workspaceView === "plan" ? (
        <nav className="lr-studio-rail" aria-label="Plan tools">
          <button type="button" className={studioPanel === "assets" ? "is-active" : ""} onClick={() => setStudioPanel("assets")} title="Assets"><span>◇</span>Assets</button>
          <button type="button" className={studioPanel === "layers" ? "is-active" : ""} onClick={() => setStudioPanel("layers")} title="Layers"><span>▱</span>Layers</button>
          <button type="button" className={studioPanel === "underlay" ? "is-active" : ""} onClick={() => setStudioPanel("underlay")} title="Plan underlay"><span>⌁</span>Import</button>
        </nav>
      ) : null}
      {props.toolRailVisible && workspaceView === "plan" ? (
        <aside className="lr-catalog lr-studio-panel" style={{ width: props.toolRailWidthPx }}>
          {studioPanel === "assets" ? (
            <>
              <div className="context-panel-heading">
                <strong>Asset Library</strong>
                <span>{LIVING_ROOM_CATALOG.length} parametric models</span>
              </div>
              <div className="lr-asset-controls">
                <input aria-label="Search assets" placeholder="Search furniture…" value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} />
                <div className="lr-asset-categories">
                  {assetCategories.map((category) => (
                    <button type="button" key={category} className={assetCategory === category ? "is-active" : ""} onClick={() => setAssetCategory(category)}>{category === "all" ? "All" : category.replace("-", " ")}</button>
                  ))}
                </div>
              </div>
              <div className="lr-asset-grid">
                {visibleAssets.map((item) => (
                  <button type="button" key={item.id} onClick={() => props.onAddCatalogObject(item.id)}>
                    <span className={`lr-asset-preview is-${item.category}`}><i /><i /><i /></span>
                    <strong>{item.name}</strong>
                    <small>{item.dimensions.widthMm} × {item.dimensions.depthMm} mm</small>
                    <b>Place</b>
                  </button>
                ))}
              </div>
            </>
          ) : studioPanel === "layers" ? (
            <>
              <div className="context-panel-heading"><strong>Layers</strong><span>Scene structure</span></div>
              <div className="lr-layer-tree">
                <div><b>⌄</b><strong>{room.name}</strong><small>Room</small></div>
                <div><b>⌄</b><strong>Architecture</strong><small>{props.project.walls.length + props.project.openings.length}</small></div>
                <span>Walls <small>{props.project.walls.length}</small></span>
                <span>Doors &amp; windows <small>{props.project.openings.length}</small></span>
                <div><b>⌄</b><strong>Furniture</strong><small>{props.project.objects.length}</small></div>
                {props.project.objects.map((object) => (
                  <button type="button" key={object.id} className={props.selectedIds.includes(object.id) ? "is-selected" : ""} onClick={() => props.onSelect(object.id)}><i>◇</i><span>{object.name}</span><small>{object.category}</small></button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="context-panel-heading"><strong>Plan Underlay</strong><span>Trace from a drawing</span></div>
              <div className="lr-underlay-panel">
                <input ref={underlayInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void importUnderlay(event.target.files?.[0] ?? null)} />
                {underlay ? (
                  <>
                    <div className="lr-underlay-thumb"><img src={underlay.dataUrl} alt="Imported floor plan" /></div>
                    <strong>{underlay.fileName}</strong>
                    <small>{Math.round(underlay.widthMm)} × {Math.round(underlay.heightMm)} mm</small>
                    <label><span>Opacity</span><input type="range" min="0.05" max="1" step="0.05" value={underlay.opacity} onChange={(event) => props.onSetPlanUnderlay({ ...underlay, opacity: Number(event.target.value) })} /></label>
                    <label><span>Calibrated width</span><input type="number" min="100" step="10" value={Math.round(underlay.widthMm)} onChange={(event) => {
                      const widthMm = Math.max(100, Number(event.target.value) || underlay.widthMm);
                      props.onSetPlanUnderlay({ ...underlay, widthMm, heightMm: underlay.heightMm * widthMm / underlay.widthMm });
                    }} /></label>
                    <p>Use the room dimensions to align the drawing, then place editable walls and assets over it.</p>
                    <button type="button" className="is-secondary" onClick={() => underlayInputRef.current?.click()}>Replace image</button>
                    <button type="button" className="is-danger" onClick={() => props.onSetPlanUnderlay(null)}>Remove underlay</button>
                  </>
                ) : (
                  <div className="lr-underlay-empty">
                    <span>⌁</span>
                    <strong>Import a floor plan</strong>
                    <p>Use PNG, JPG, or WebP as a calibrated tracing underlay. The image stays portable inside the project file.</p>
                    <button type="button" onClick={() => underlayInputRef.current?.click()}>Choose plan image</button>
                  </div>
                )}
                {importError ? <p className="lr-import-error">{importError}</p> : null}
              </div>
            </>
          )}
        </aside>
      ) : null}

      <div className="lr-plan-center">
        {workspaceView === "plan" ? <header className="lr-plan-toolbar">
            <>
              <div className="lr-toolbar-group">
                <span>Edit</span>
                <button type="button" aria-label="Undo" title="Undo" onClick={props.onUndo} disabled={!props.canUndo}>↶</button>
                <button type="button" aria-label="Redo" title="Redo" onClick={props.onRedo} disabled={!props.canRedo}>↷</button>
                <button type="button" aria-label="Duplicate" title="Duplicate" onClick={props.onDuplicate} disabled={!activeObject}>⧉</button>
                <button type="button" aria-label="Delete" title="Delete" onClick={props.onDelete} disabled={!activeObject}>⌫</button>
              </div>
              <div className="lr-toolbar-group">
                <span>Transform</span>
                <button type="button" title="Rotate left 90°" onClick={() => props.onRotateSelection(-90)} disabled={!activeObject}>−90°</button>
                <button type="button" title="Rotate right 90°" onClick={() => props.onRotateSelection(90)} disabled={!activeObject}>+90°</button>
              </div>
              <div className="lr-toolbar-group">
                <span>Align</span>
                <button type="button" title="Align left" onClick={() => props.onAlign("left")} disabled={props.selectedIds.length < 2}>L</button>
                <button type="button" title="Align centers" onClick={() => props.onAlign("center-x")} disabled={props.selectedIds.length < 2}>C</button>
                <button type="button" title="Align middles" onClick={() => props.onAlign("center-z")} disabled={props.selectedIds.length < 2}>M</button>
                <button type="button" title="Distribute" onClick={() => props.onAlign("distribute-x")} disabled={props.selectedIds.length < 3}>↔</button>
              </div>
            </>
          <div className="lr-toolbar-group lr-toolbar-view">
            <span>Drawing</span>
                <label>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(event) => setShowGrid(event.target.checked)}
                  /> Grid
                </label>
                <select value={snapSizeMm} onChange={(event) => setSnapSizeMm(Number(event.target.value))}>
                  <option value="25">25 mm</option>
                  <option value="50">50 mm</option>
                  <option value="100">100 mm</option>
                </select>
          </div>
        </header> : null}
        <div className="lr-plan-titlebar">
          <strong>{workspaceView.toUpperCase()} · LIVING ROOM</strong>
          <span>{props.project.name} · {props.project.objects.length} objects · {props.selectedIds.length} selected</span>
          <small>{workspaceView === "plan" ? "Scale: Fit" : workspaceView === "model" ? "Perspective" : "Presentation Output"} · Units: mm</small>
        </div>
        <div className="lr-plan-canvas" data-testid="lr-plan-canvas">
          {workspaceView === "plan" ? (
            <LivingRoomPlanView
              project={props.project}
              selectedIds={props.selectedIds}
              issues={props.issues}
              snapSizeMm={snapSizeMm}
              showGrid={showGrid}
              onSelect={props.onSelect}
              onMove={props.onMove}
              onResize={props.onResize}
            />
          ) : workspaceView === "model" ? (
            <LivingRoomModelView
              project={props.project}
              selectedIds={props.selectedIds}
              snapSizeMm={snapSizeMm}
              showGrid={showGrid}
              onSelect={props.onSelect}
              onMove={props.onMove}
              onSetRotation={props.onSetRotation}
              onApplyStyle={props.onApplyStyle}
            />
          ) : (
            <LivingRoomRenderStudio
              project={props.project}
              latestResult={renderResults.latest}
              previousResult={renderResults.previous}
              onRendered={(result) => setRenderResults((current) => ({
                latest: result,
                previous: current.latest,
              }))}
              onSettingsChange={props.onRenderSettingsChange}
              onLightingChange={props.onLightingChange}
              onBrowserThumbnail={props.onRenderBrowserThumbnail}
            />
          )}
        </div>
        <footer className="lr-plan-status">
          <span>{workspaceView === "render" ? "OUTPUT PNG" : `SNAP ${snapSizeMm}`}</span>
          <span>{workspaceView === "plan" ? "ORTHO ON" : workspaceView === "model" ? "ORBIT READY" : "ACES / SRGB"}</span>
          <span>{workspaceView === "render" ? `${props.project.renderSettings.widthPx}×${props.project.renderSettings.heightPx}` : `GRID ${showGrid ? "ON" : "OFF"}`}</span>
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

      {props.inspectorVisible && workspaceView === "plan" ? (
        <aside className="lr-inspector" style={{ width: props.inspectorWidthPx }}>
          <div className="inspector-header">
            <strong>Plan Properties</strong>
            <span>{activeObject?.name ?? `${props.selectedIds.length} selected`}</span>
          </div>
          <div className="lr-inspector-scroll">
            <section>
              <h3>Room</h3>
              <NumberField
                label="Width"
                value={room.dimensions.widthMm}
                onChange={(widthMm) =>
                  props.onRoomDimensions({ ...room.dimensions, widthMm })
                }
              />
              <NumberField
                label="Depth"
                value={room.dimensions.depthMm}
                onChange={(depthMm) =>
                  props.onRoomDimensions({ ...room.dimensions, depthMm })
                }
              />
              <NumberField
                label="Height"
                value={room.dimensions.heightMm}
                onChange={(heightMm) =>
                  props.onRoomDimensions({ ...room.dimensions, heightMm })
                }
              />
            </section>
            {activeObject ? (
              <section>
                <h3>Selected Object</h3>
                <div className="lr-object-identity">
                  <strong>{activeObject.name}</strong>
                  <span>{activeObject.catalogItemId}</span>
                </div>
                <h4>Position</h4>
                <NumberField
                  label="X"
                  value={activeObject.position.x}
                  onChange={(value) => patchPosition("x", value)}
                />
                <NumberField
                  label="Z"
                  value={activeObject.position.z}
                  onChange={(value) => patchPosition("z", value)}
                />
                <h4>Size</h4>
                <NumberField
                  label="Width"
                  value={activeObject.dimensions.widthMm}
                  onChange={(value) => patchDimensions("widthMm", value)}
                />
                <NumberField
                  label="Depth"
                  value={activeObject.dimensions.depthMm}
                  onChange={(value) => patchDimensions("depthMm", value)}
                />
                <NumberField
                  label="Height"
                  value={activeObject.dimensions.heightMm}
                  onChange={(value) => patchDimensions("heightMm", value)}
                />
                <label className="lr-select-field">
                  <span>Rotation</span>
                  <select
                    value={activeObject.rotation.y}
                    onChange={(event) =>
                      props.onSetRotation(activeObject.id, Number(event.target.value))
                    }
                  >
                    <option value="0">0°</option>
                    <option value="45">45°</option>
                    <option value="90">90°</option>
                    <option value="135">135°</option>
                    <option value="180">180°</option>
                    <option value="225">225°</option>
                    <option value="270">270°</option>
                    <option value="315">315°</option>
                  </select>
                </label>
                <h4>Materials</h4>
                <div className="lr-material-slots">
                  {Object.entries(activeObject.materialSlots).map(([slotName, materialId]) => {
                    const material = props.project!.materials.find((item) => item.id === materialId);
                    return (
                      <label key={slotName}>
                        <span><i style={{ background: material?.color ?? "#ccc" }} />{slotName}</span>
                        <select value={materialId} onChange={(event) => props.onSetMaterial(activeObject.id, slotName, event.target.value)}>
                          {props.project!.materials.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="lr-inspector-empty">
                <h3>Selection</h3>
                <p>Select an object in plan to edit exact dimensions and placement.</p>
              </section>
            )}
            <section className="lr-issues-panel">
              <h3>Layout Checks <span>{props.issues.length}</span></h3>
              {props.issues.length === 0 ? (
                <p className="is-clear">No conflicts detected.</p>
              ) : (
                props.issues.slice(0, 10).map((issue, index) => (
                  <button
                    type="button"
                    key={`${issue.code}-${index}`}
                    onClick={() => props.onSelect(issue.objectIds[0] ?? null)}
                  >
                    <b>{issue.severity === "error" ? "!" : "△"}</b>
                    <span>{issue.message}</span>
                  </button>
                ))
              )}
            </section>
          </div>
        </aside>
      ) : null}
      </div>
    </section>
  );
}
