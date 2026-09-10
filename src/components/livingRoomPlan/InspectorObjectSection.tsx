import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../../domain/interiorProject";
import { LivingRoomObjectInspector } from "./LivingRoomObjectInspector";
import { NumberField } from "./NumberField";
import { isWallCabinetObject, resolveWallMountHeightMm } from "../../domain/livingRoom/cabinetSceneMount";

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
  const position = isWallCabinetObject(object)
    ? { ...object.position, y: resolveWallMountHeightMm(object) }
    : object.position;
  const actions = (
    <div className="lr-object-edit-actions" aria-label="Selected object actions">
      <button type="button" data-testid="inspector-duplicate" onClick={props.onDuplicate}>Duplicate</button>
      <button type="button" data-testid="inspector-copy" onClick={props.onDuplicate}>Copy</button>
      <button type="button" data-testid="inspector-delete" className="is-danger" onClick={props.onDelete}>Delete</button>
    </div>
  );
  const positionEditor = (
    <details className="lr-inspector-section lr-transform-editor" open={props.mode === "model"}>
      <summary>Position &amp; rotation</summary>
      <div className="lr-inspector-section-body lr-position-fields">
        <NumberField label="X" value={position.x}
          onChange={(value) => props.onMove(object.id, { ...position, x: value })} />
        <NumberField label="Y" value={position.y}
          onChange={(value) => props.onMove(object.id, { ...position, y: value })} />
        <NumberField label="Z" value={position.z}
          onChange={(value) => props.onMove(object.id, { ...position, z: value })} />
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
  );
  return (
    <LivingRoomObjectInspector
      object={object} project={props.project} materials={props.project.materials}
      onResize={props.onResize} onSetMaterial={props.onSetMaterial}
      onSetParameters={props.onSetParameters} onUpdateRun={props.onUpdateCabinetRun} onCompleteRun={props.onCompleteCabinetRun}
      onUpdatePanelAttachment={props.onUpdatePanelAttachment}
      onSetPanelVisible={props.onSetPanelVisible}
      onAddWallPanel={props.onAddWallPanel}
      actions={actions}
      positionEditor={positionEditor}
    />
  );
}
