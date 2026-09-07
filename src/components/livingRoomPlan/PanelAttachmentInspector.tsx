import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import {
  isWallPanelObject,
  readPanelAttachment,
  type PanelAttachment,
  type PanelWallSide,
} from "../../domain/livingRoom";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  onUpdateAttachment: (objectId: string, patch: Partial<PanelAttachment>) => void;
  onSetVisible: (objectId: string, visible: boolean) => void;
  onAddWallPanel?: (wallId: string) => void;
};

/** M5 — §2.1 attachment fields for decorative / feature wall panels. */
export function PanelAttachmentInspector({
  object, project, onUpdateAttachment, onSetVisible, onAddWallPanel,
}: Props) {
  if (!isWallPanelObject(object)) return null;
  const attachment = readPanelAttachment(object);
  if (!attachment) {
    return (
      <section className="lr-panel-attachment" data-testid="panel-attachment-inspector">
        <p>Select a host wall and use Add Wall Panel to attach this panel.</p>
      </section>
    );
  }

  const host = project.walls.find((wall) => wall.id === attachment.wallId);

  return (
    <section className="lr-panel-attachment" data-testid="panel-attachment-inspector">
      <h4>Wall panel attachment</h4>
      <p className="lr-inspector-hint">
        Host {host ? String(host.extensions?.wallSide ?? host.id) : attachment.wallId}
        {" · "}structure unchanged by panel edits
      </p>
      <NumberField
        label="Along wall (mm)"
        value={attachment.alongMm}
        onChange={(alongMm) => onUpdateAttachment(object.id, { alongMm })}
      />
      <NumberField
        label="Floor offset (mm)"
        value={attachment.floorOffsetMm}
        onChange={(floorOffsetMm) => onUpdateAttachment(object.id, { floorOffsetMm })}
      />
      <label className="lr-select-field">
        <span>Wall face</span>
        <select
          data-testid="panel-wall-side"
          value={attachment.wallSide}
          onChange={(event) => onUpdateAttachment(object.id, {
            wallSide: event.target.value as PanelWallSide,
          })}
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
        </select>
      </label>
      <div className="lr-wall-panel-actions">
        {onAddWallPanel ? (
          <button
            type="button"
            data-testid="add-wall-panel"
            onClick={() => onAddWallPanel(attachment.wallId)}
          >
            Add Wall Panel
          </button>
        ) : null}
        <button
          type="button"
          data-testid="panel-toggle-visible"
          onClick={() => onSetVisible(object.id, !attachment.visible)}
        >
          {attachment.visible ? "Hide Panel" : "Show Panel"}
        </button>
      </div>
    </section>
  );
}
