import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../../domain/interiorProject";
import { LivingRoomObjectInspector } from "./LivingRoomObjectInspector";
import { NumberField } from "./NumberField";

type Props = {
  mode: "plan" | "model";
  object: InteriorObjectEntity;
  project: InteriorProject;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onCompleteCabinetRun?: (runId: string) => void;
  onUpdateCabinetRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdatePanelAttachment?: (
    objectId: string,
    patch: Partial<import("../../domain/livingRoom").PanelAttachment>,
  ) => void;
  onSetPanelVisible?: (objectId: string, visible: boolean) => void;
  onAddWallPanel?: (wallId: string) => void;
};

export function InspectorObjectSection(props: Props) {
  const { object } = props;
  const actions = (
    <div className="lr-object-edit-actions" aria-label="Selected object actions">
      <button type="button" data-testid="inspector-duplicate" onClick={props.onDuplicate}>Duplicate</button>
      <button type="button" data-testid="inspector-copy" onClick={props.onDuplicate}>Copy</button>
      <button type="button" data-testid="inspector-delete" className="is-danger" onClick={props.onDelete}>Delete</button>
    </div>
  );
  return (
    <>
      <LivingRoomObjectInspector
        object={object} project={props.project} materials={props.project.materials}
        onResize={props.onResize} onSetMaterial={props.onSetMaterial}
        onSetParameters={props.onSetParameters} onUpdateRun={props.onUpdateCabinetRun} onCompleteRun={props.onCompleteCabinetRun}
        onUpdatePanelAttachment={props.onUpdatePanelAttachment}
        onSetPanelVisible={props.onSetPanelVisible}
        onAddWallPanel={props.onAddWallPanel}
        actions={actions}
      />
      {props.mode === "plan" ? (
        <details className="lr-inspector-section">
          <summary>Position &amp; rotation</summary>
          <div className="lr-inspector-section-body">
            <NumberField label="X" value={object.position.x}
              onChange={(value) => props.onMove(object.id, { ...object.position, x: value })} />
            <NumberField label="Z" value={object.position.z}
              onChange={(value) => props.onMove(object.id, { ...object.position, z: value })} />
            <label className="lr-select-field">
              <span>Rotation</span>
              <select value={object.rotation.y}
                onChange={(event) => props.onSetRotation(object.id, Number(event.target.value))}>
                <option value="0">0°</option><option value="45">45°</option>
                <option value="90">90°</option><option value="135">135°</option>
                <option value="180">180°</option><option value="225">225°</option>
                <option value="270">270°</option><option value="315">315°</option>
              </select>
            </label>
          </div>
        </details>
      ) : (
        <p className="lr-inspector-hint">Drag in the room to move this object. Dimensions and finishes stay synchronized with Plan.</p>
      )}
    </>
  );
}
