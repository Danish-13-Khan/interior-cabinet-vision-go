import type {
  InteriorObjectEntity,
  InteriorProject,
  OpeningEntity,
  Point3Mm,
  Size3Mm,
  WallPlanPatch,
} from "../../domain/interiorProject";
import type {
  LivingRoomPlanIssue,
  MillworkSchedule,
  MillworkWorkflowSnapshot,
} from "../../domain/livingRoom";
import type { ProjectReport } from "../../domain/projectReport";
import { interiorsSelectionTitle } from "../../domain/desktopUx";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";
import { InspectorObjectSection } from "./InspectorObjectSection";
import { MillworkSchedulePreview } from "./millworkSchedule";
import { OpeningInspector } from "./OpeningInspector";
import { PlanArchitectureInspector } from "./PlanArchitectureInspector";
import { InspectorObjectList } from "./InspectorObjectList";
import { SurfaceInspector } from "./SurfaceInspector";

type LivingRoomInspectorPanelProps = {
  mode: "plan" | "model";
  widthPx: number;
  project: InteriorProject;
  room: InteriorProject["rooms"][number] | null;
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
  onSetFloorMaterial: (materialId: string) => void;
  onSetCeilingMaterial: (materialId: string) => void;
  onRaiseWalls: (wallIds: string[], raised: boolean, heightMm?: number) => void;
  onOffsetWall: (wallId: string, offsetMm: number) => void;
  onOffsetLoop: (offsetMm: number) => void;
  onSetWallPlan: (wallId: string, patch: WallPlanPatch) => void;
  onImportFinish: (file: File, apply?: { wallId?: string; floor?: boolean; ceiling?: boolean }) => void;
  onSetFinishUv: (materialId: string, patch: { uvScaleMm?: number; uvRotationDeg?: number }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  unit: import("../../domain/livingRoom").PlanDisplayUnit;
  drawRoom?: boolean;
  inspectRoom?: boolean;
  activeSurface?: InteriorProject["surfaces"][number] | null;
  onDeleteOpening?: (openingId: string) => void;
  onUpdateSurface?: (surfaceId: string, materialId: string) => void;
  onDeleteSurface?: (surfaceId: string) => void;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onJoinNodes?: () => void;
};

export function LivingRoomInspectorPanel(props: LivingRoomInspectorPanelProps) {
  const activeWall = props.project.walls.find((wall) => wall.id === props.activeWallId) ?? null;
  const { room, activeOpening, activeObject, activeSurface } = props;
  const selectionTitle = interiorsSelectionTitle({
    openingName: activeOpening ? `${activeOpening.kind} opening` : null,
    objectName: activeObject?.name ?? null,
    wallLabel: activeWall ? String(activeWall.extensions?.wallSide ?? "Wall") : null,
    surfaceName: activeSurface ? "Surface zone" : null,
    roomName: props.inspectRoom ? room?.name ?? null : null,
    selectedCount: props.selectedCount,
  });
  return (
    <aside className={`lr-inspector ${activeOpening ? "has-opening-selection" : ""}`} style={{ width: props.widthPx }}>
      <div className="inspector-header">
        <span className="lr-chrome-eyebrow">Selected</span>
        <strong>{selectionTitle}</strong>
      </div>
      <div className="lr-inspector-scroll">
        {room && !props.drawRoom ? (
          <InspectorObjectList
            objects={props.project.objects}
            roomId={room.id}
            selectedId={activeObject?.id ?? null}
            onSelect={props.onSelect}
          />
        ) : null}
        {activeSurface ? (
          <SurfaceInspector surface={activeSurface} materials={props.project.materials}
            onUpdate={props.onUpdateSurface} onDelete={props.onDeleteSurface} />
        ) : room && !(props.drawRoom && activeOpening) ? (
          <PlanArchitectureInspector project={props.project} room={room} wall={activeWall}
            onRoomDimensions={props.onRoomDimensions} onUpdateWall={props.onUpdateWall}
            onSetWallMaterial={props.onSetWallMaterial} onSetFloorMaterial={props.onSetFloorMaterial}
            onSetCeilingMaterial={props.onSetCeilingMaterial} onRaiseWalls={props.onRaiseWalls}
            onOffsetWall={props.onOffsetWall} onOffsetLoop={props.onOffsetLoop}
            onSetWallPlan={props.onSetWallPlan} onImportFinish={props.onImportFinish}
            onSetFinishUv={props.onSetFinishUv} unit={props.unit}
            suppressEmptyWall={Boolean(activeOpening || (props.drawRoom && !activeWall))} compact={props.drawRoom}
            hideRoom={Boolean(props.drawRoom && !props.inspectRoom)}
            onSplitWall={props.onSplitWall} onDeleteWall={props.onDeleteWall} onJoinNodes={props.onJoinNodes} />
        ) : !room ? (
          <section className="lr-inspector-empty">
            <h3>Room</h3>
            <p>Draw a rectangle or polygon on the plan. Raise walls when you want 3D. 2D and 3D stay separate until you raise.</p>
          </section>
        ) : null}
        {activeOpening ? <OpeningInspector opening={activeOpening} materials={props.project.materials} onUpdate={props.onUpdateOpening} onDelete={props.onDeleteOpening} /> : activeObject ? (
          <InspectorObjectSection
            mode={props.mode} object={activeObject} project={props.project}
            onMove={props.onMove} onResize={props.onResize} onSetRotation={props.onSetRotation}
            onSetMaterial={props.onSetMaterial} onSetParameters={props.onSetParameters}
            onUpdateCabinetRun={props.onUpdateCabinetRun}
            onDuplicate={props.onDuplicate} onDelete={props.onDelete}
          />
        ) : props.drawRoom ? null : (
          <section className="lr-inspector-empty">
            <h3>Selection</h3>
            <p>
              {props.mode === "plan"
                ? "Select an object to move, rotate, resize, duplicate, or delete."
                : "Select a piece in the room to set size and finish."}
            </p>
          </section>
        )}
        {props.millworkSchedule && props.millworkWorkflow && !props.drawRoom ? (
          <MillworkSchedulePreview
            schedule={props.millworkSchedule}
            workflow={props.millworkWorkflow}
            productionReport={props.productionReport}
            exportedAt={props.millworkExportedAt}
            onSelect={props.onSelect}
          />
        ) : null}
        {props.drawRoom ? null : <InspectorLayoutChecks issues={props.issues} onSelect={props.onSelect} />}
      </div>
    </aside>
  );
}
