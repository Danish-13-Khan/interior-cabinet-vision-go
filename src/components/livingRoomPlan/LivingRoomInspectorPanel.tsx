import type {
  InteriorObjectEntity,
  InteriorProject,
  OpeningEntity,
  Point3Mm,
  Size3Mm,
} from "../../domain/interiorProject";
import type {
  LivingRoomPlanIssue,
  MillworkSchedule,
  MillworkWorkflowSnapshot,
} from "../../domain/livingRoom";
import { isBlockingLivingRoomPlanIssue } from "../../domain/livingRoom";
import type { ProjectReport } from "../../domain/projectReport";
import { LivingRoomObjectInspector } from "./LivingRoomObjectInspector";
import { MillworkSchedulePreview } from "./millworkSchedule";
import { NumberField } from "./NumberField";
import { OpeningInspector } from "./OpeningInspector";
import { PlanArchitectureInspector } from "./PlanArchitectureInspector";

type LivingRoomInspectorPanelProps = {
  mode: "plan" | "model";
  widthPx: number;
  project: InteriorProject;
  room: InteriorProject["rooms"][number];
  activeObject: InteriorObjectEntity | null;
  activeOpening: OpeningEntity | null;
  activeWallId: string | null;
  selectedCount: number;
  issues: LivingRoomPlanIssue[];
  millworkSchedule: MillworkSchedule | null;
  millworkWorkflow: MillworkWorkflowSnapshot | null;
  productionReport: ProjectReport | null;
  millworkExportedAt: string | null;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onUpdateCabinetRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
  onSelect: (objectId: string | null) => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots">>) => void;
  onUpdateWall: (wallId: string, patch: { thicknessMm?: number; heightMm?: number }) => void;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
  unit: import("../../domain/livingRoom").PlanDisplayUnit;
};

export function LivingRoomInspectorPanel({
  mode,
  widthPx,
  project,
  room,
  activeObject,
  activeOpening,
  activeWallId,
  selectedCount,
  issues,
  millworkSchedule,
  millworkWorkflow,
  productionReport,
  millworkExportedAt,
  onRoomDimensions,
  onMove,
  onResize,
  onSetRotation,
  onSetMaterial,
  onSetParameters,
  onUpdateCabinetRun,
  onSelect,
  onUpdateOpening,
  onUpdateWall,
  onSetWallMaterial,
  unit,
}: LivingRoomInspectorPanelProps) {
  const activeWall = project.walls.find((wall) => wall.id === activeWallId) ?? null;
  return (
    <aside className="lr-inspector" style={{ width: widthPx }}>
      <div className="inspector-header">
        <strong>{mode === "plan" ? "Plan Properties" : "Model Properties"}</strong>
        <span>{activeOpening ? "Opening selected" : activeObject?.name ?? (activeWall ? "Wall selected" : `${selectedCount} selected`)}</span>
      </div>
      <div className="lr-inspector-scroll">
        {mode === "plan" ? (
          <PlanArchitectureInspector project={project} room={room} wall={activeWall}
            onRoomDimensions={onRoomDimensions} onUpdateWall={onUpdateWall} onSetWallMaterial={onSetWallMaterial} unit={unit} />
        ) : null}
        {activeOpening ? <OpeningInspector opening={activeOpening} materials={project.materials} onUpdate={onUpdateOpening} /> : activeObject ? (
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
              project={project}
              materials={project.materials}
              onResize={onResize}
              onSetMaterial={onSetMaterial}
              onSetParameters={onSetParameters}
              onUpdateRun={onUpdateCabinetRun}
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
        {millworkSchedule && millworkWorkflow ? (
          <MillworkSchedulePreview
            schedule={millworkSchedule}
            workflow={millworkWorkflow}
            productionReport={productionReport}
            exportedAt={millworkExportedAt}
            onSelect={onSelect}
          />
        ) : null}
        <section className="lr-issues-panel">
            <h3>Layout Checks <span>{issues.length}</span></h3>
            {issues.length === 0 ? (
              <p className="is-clear">No conflicts detected.</p>
            ) : (
              issues.slice(0, 10).map((issue, index) => (
                <button
                  type="button"
                  key={`${issue.code}-${index}`}
                  data-layout-issue={issue.code}
                  className={isBlockingLivingRoomPlanIssue(issue) ? "is-error" : "is-warning"}
                  aria-label={`${issue.severity}: ${issue.message}`}
                  onClick={() => onSelect(issue.objectIds[0] ?? null)}
                >
                  <b>{issue.severity === "error" ? "!" : "△"}</b>
                  <span>{issue.message}</span>
                </button>
              ))
            )}
        </section>
      </div>
    </aside>
  );
}
