import { useEffect, useState } from "react";
import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../domain/interiorProject";
import {
  LIVING_ROOM_CATALOG,
  type LivingRoomAlignMode,
  type LivingRoomCatalogId,
  type LivingRoomPlanIssue,
} from "../domain/livingRoom";
import { LivingRoomModelView } from "./LivingRoomModelView";
import { LivingRoomPlanView } from "./LivingRoomPlanView";

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
  onCreateStarter: () => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onRotateSelection: (deltaDegrees: number) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onNudge: (dx: number, dz: number) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onUndo: () => void;
  onRedo: () => void;
};

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
  const [workspaceView, setWorkspaceView] = useState<"plan" | "model">("plan");
  const activeObject = props.selectedObjects[0] ?? null;
  const room = props.project?.rooms.find(
    (item) => item.id === props.project?.activeRoomId,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
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

  if (!props.project || !room) {
    return (
      <section className="lr-empty-workspace">
        <div>
          <span>INTERIOR PLAN</span>
          <h1>Living Room Starter</h1>
          <p>Create the deterministic LR-02 room and begin accurate plan-first layout.</p>
          <button type="button" onClick={props.onCreateStarter}>Create Living Room Plan</button>
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

  return (
    <section className="lr-plan-shell">
      {props.toolRailVisible ? (
        <aside className="lr-catalog" style={{ width: props.toolRailWidthPx }}>
          <div className="context-panel-heading">
            <strong>Living Room Catalog</strong>
            <span>Place objects</span>
          </div>
          <div className="lr-catalog-list">
            {LIVING_ROOM_CATALOG.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => props.onAddCatalogObject(item.id)}
              >
                <span className="lr-catalog-code">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.dimensions.widthMm} × {item.dimensions.depthMm}</small>
                </span>
                <b>+</b>
              </button>
            ))}
          </div>
          <div className="lr-catalog-help">
            <strong>Selection</strong>
            <span>Shift-click adds objects</span>
            <span>Arrow keys nudge by grid</span>
            <span>R rotates 90°</span>
          </div>
        </aside>
      ) : null}

      <div className="lr-plan-center">
        <header className="lr-plan-toolbar">
          <div className="lr-toolbar-group">
            <span>Edit</span>
            <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>Undo</button>
            <button type="button" onClick={props.onRedo} disabled={!props.canRedo}>Redo</button>
            <button type="button" onClick={props.onDuplicate} disabled={!activeObject}>Duplicate</button>
            <button type="button" onClick={props.onDelete} disabled={!activeObject}>Delete</button>
          </div>
          <div className="lr-toolbar-group">
            <span>Transform</span>
            <button type="button" onClick={() => props.onRotateSelection(-90)} disabled={!activeObject}>↶ 90°</button>
            <button type="button" onClick={() => props.onRotateSelection(90)} disabled={!activeObject}>↷ 90°</button>
          </div>
          <div className="lr-toolbar-group">
            <span>Align</span>
            <button type="button" onClick={() => props.onAlign("left")} disabled={props.selectedIds.length < 2}>
              Left
            </button>
            <button type="button" onClick={() => props.onAlign("center-x")} disabled={props.selectedIds.length < 2}>
              Center
            </button>
            <button type="button" onClick={() => props.onAlign("center-z")} disabled={props.selectedIds.length < 2}>
              Middle
            </button>
            <button type="button" onClick={() => props.onAlign("distribute-x")} disabled={props.selectedIds.length < 3}>
              Distribute
            </button>
          </div>
          <div className="lr-toolbar-group lr-toolbar-view">
            <span>View</span>
            <div className="lr-view-switch" role="group" aria-label="Interior workspace view">
              <button
                type="button"
                className={workspaceView === "plan" ? "is-active" : ""}
                onClick={() => setWorkspaceView("plan")}
              >
                Plan
              </button>
              <button
                type="button"
                className={workspaceView === "model" ? "is-active" : ""}
                onClick={() => setWorkspaceView("model")}
              >
                Model
              </button>
            </div>
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
        </header>
        <div className="lr-plan-titlebar">
          <strong>{workspaceView === "plan" ? "PLAN" : "MODEL"} · LIVING ROOM</strong>
          <span>{props.project.objects.length} objects · {props.selectedIds.length} selected</span>
          <small>{workspaceView === "plan" ? "Scale: Fit" : "Perspective"} · Units: mm</small>
        </div>
        <div className="lr-plan-canvas">
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
          ) : (
            <LivingRoomModelView
              project={props.project}
              selectedIds={props.selectedIds}
              snapSizeMm={snapSizeMm}
              showGrid={showGrid}
              onSelect={props.onSelect}
              onMove={props.onMove}
            />
          )}
        </div>
        <footer className="lr-plan-status">
          <span>SNAP {snapSizeMm}</span>
          <span>{workspaceView === "plan" ? "ORTHO ON" : "ORBIT READY"}</span>
          <span>GRID {showGrid ? "ON" : "OFF"}</span>
          <span className={props.issues.length ? "has-warning" : ""}>
            {props.issues.length ? `${props.issues.length} planning issues` : "Layout checks clear"}
          </span>
        </footer>
      </div>

      {props.inspectorVisible ? (
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
    </section>
  );
}
