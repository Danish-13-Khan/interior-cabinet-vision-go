import type { CabinetPlacement } from "../../domain/cabinetDimensions";
import type { PropertyFieldIssue } from "../../domain/cabinetEditorSchema";
import type { NumericInputKey } from "./types";

export function PlacementSection({
  showWallTools,
  attachment,
  rotation,
  snapSizeMm,
  inputs,
  fieldIssues = {},
  onRotationChange,
  onAttachmentChange,
  handleNumericInputChange,
  handleBlur,
}: {
  showWallTools: boolean;
  attachment: CabinetPlacement["attachment"];
  rotation: number;
  snapSizeMm: number;
  inputs: Record<NumericInputKey, string>;
  fieldIssues?: Record<string, PropertyFieldIssue[]>;
  onRotationChange: (rotation: number) => void;
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  handleNumericInputChange: (key: NumericInputKey, value: string) => void;
  handleBlur: (key: NumericInputKey) => void;
}) {
  const attachmentIssue = fieldIssues.attachment?.[0];
  const yIssue = fieldIssues.placementY?.[0];

  return (
    <div className="control-section engineering-placement">
      <div className="section-heading">
        <h2>Placement</h2>
        <span>Rotation · attachment · world mm</span>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="rot-slider">Rotation</label>
          <select
            id="rot-slider"
            value={rotation}
            onChange={(event) => onRotationChange(Number(event.target.value))}
          >
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      </div>

      {showWallTools ? (
        <div className={`wall-tools ${attachmentIssue ? `has-${attachmentIssue.severity}` : ""}`}>
          <label>Attachment</label>
          <div className="button-row">
            {(
              [
                ["floor", "Floor"],
                ["back-wall", "Back Wall"],
                ["left-wall", "Left Wall"],
                ["right-wall", "Right Wall"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={attachment === value ? "active" : ""}
                onClick={() => onAttachmentChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {attachmentIssue ? (
            <p className={`property-grid-issue severity-${attachmentIssue.severity}`}>
              {attachmentIssue.message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="engineering-note">Floor-mounted family — wall attachment locked.</p>
      )}

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="placement-x">X</label>
          <input
            id="placement-x"
            type="number"
            step={snapSizeMm}
            value={inputs.placementX}
            onChange={(event) => handleNumericInputChange("placementX", event.currentTarget.value)}
            onBlur={() => handleBlur("placementX")}
          />
        </div>
        <div className={`field-group ${yIssue ? `has-${yIssue.severity}` : ""}`}>
          <label htmlFor="placement-y">Y</label>
          <input
            id="placement-y"
            type="number"
            step={snapSizeMm}
            value={inputs.placementY}
            onChange={(event) => handleNumericInputChange("placementY", event.currentTarget.value)}
            onBlur={() => handleBlur("placementY")}
          />
          {yIssue ? (
            <span className={`property-grid-issue severity-${yIssue.severity}`}>
              {yIssue.message}
            </span>
          ) : null}
        </div>
        <div className="field-group">
          <label htmlFor="placement-z">Z</label>
          <input
            id="placement-z"
            type="number"
            step={snapSizeMm}
            value={inputs.placementZ}
            onChange={(event) => handleNumericInputChange("placementZ", event.currentTarget.value)}
            onBlur={() => handleBlur("placementZ")}
          />
        </div>
      </div>
    </div>
  );
}
