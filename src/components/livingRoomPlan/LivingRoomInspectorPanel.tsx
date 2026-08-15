import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../../domain/interiorProject";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import { LivingRoomObjectInspector } from "./LivingRoomObjectInspector";
import { NumberField } from "./NumberField";

type LivingRoomInspectorPanelProps = {
  mode: "plan" | "model";
  widthPx: number;
  project: InteriorProject;
  room: InteriorProject["rooms"][number];
  activeObject: InteriorObjectEntity | null;
  selectedCount: number;
  issues: LivingRoomPlanIssue[];
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSelect: (objectId: string | null) => void;
};

export function LivingRoomInspectorPanel({
  mode,
  widthPx,
  project,
  room,
  activeObject,
  selectedCount,
  issues,
  onRoomDimensions,
  onMove,
  onResize,
  onSetRotation,
  onSetMaterial,
  onSelect,
}: LivingRoomInspectorPanelProps) {
  return (
    <aside className="lr-inspector" style={{ width: widthPx }}>
      <div className="inspector-header">
        <strong>{mode === "plan" ? "Plan Properties" : "Model Properties"}</strong>
        <span>{activeObject?.name ?? `${selectedCount} selected`}</span>
      </div>
      <div className="lr-inspector-scroll">
        {mode === "plan" ? (
          <section>
            <h3>Room</h3>
            <NumberField
              label="Width"
              value={room.dimensions.widthMm}
              onChange={(widthMm) => onRoomDimensions({ ...room.dimensions, widthMm })}
            />
            <NumberField
              label="Depth"
              value={room.dimensions.depthMm}
              onChange={(depthMm) => onRoomDimensions({ ...room.dimensions, depthMm })}
            />
            <NumberField
              label="Height"
              value={room.dimensions.heightMm}
              onChange={(heightMm) => onRoomDimensions({ ...room.dimensions, heightMm })}
            />
          </section>
        ) : null}
        {activeObject ? (
          <>
            {mode === "plan" ? (
              <section>
                <h4>Position</h4>
                <NumberField
                  label="X"
                  value={activeObject.position.x}
                  onChange={(value) => onMove(activeObject.id, { ...activeObject.position, x: value })}
                />
                <NumberField
                  label="Z"
                  value={activeObject.position.z}
                  onChange={(value) => onMove(activeObject.id, { ...activeObject.position, z: value })}
                />
                <label className="lr-select-field">
                  <span>Rotation</span>
                  <select
                    value={activeObject.rotation.y}
                    onChange={(event) => onSetRotation(activeObject.id, Number(event.target.value))}
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
              <p className="lr-inspector-hint">Drag in the room to place. Size and finish below match Plan.</p>
            )}
            <LivingRoomObjectInspector
              object={activeObject}
              materials={project.materials}
              onResize={onResize}
              onSetMaterial={onSetMaterial}
            />
          </>
        ) : (
          <section className="lr-inspector-empty">
            <h3>Selection</h3>
            <p>
              {mode === "plan"
                ? "Select an object in plan to edit exact dimensions and placement."
                : "Select a piece in the room to set size and finish."}
            </p>
          </section>
        )}
        {mode === "plan" ? (
          <section className="lr-issues-panel">
            <h3>Layout Checks <span>{issues.length}</span></h3>
            {issues.length === 0 ? (
              <p className="is-clear">No conflicts detected.</p>
            ) : (
              issues.slice(0, 10).map((issue, index) => (
                <button
                  type="button"
                  key={`${issue.code}-${index}`}
                  onClick={() => onSelect(issue.objectIds[0] ?? null)}
                >
                  <b>{issue.severity === "error" ? "!" : "△"}</b>
                  <span>{issue.message}</span>
                </button>
              ))
            )}
          </section>
        ) : null}
      </div>
    </aside>
  );
}
