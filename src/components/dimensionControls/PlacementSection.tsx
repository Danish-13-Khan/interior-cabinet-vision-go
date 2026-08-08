import type { CabinetPlacement } from "../../domain/cabinetDimensions";
import type { NumericInputKey } from "./types";

export function PlacementSection({
  showWallTools,
  attachment,
  rotation,
  snapSizeMm,
  inputs,
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
  onRotationChange: (rotation: number) => void;
  onAttachmentChange: (attachment: CabinetPlacement["attachment"]) => void;
  handleNumericInputChange: (key: NumericInputKey, value: string) => void;
  handleBlur: (key: NumericInputKey) => void;
}) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Placement</h2>
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
        <div className="wall-tools">
          <label>Attachment</label>
          <div className="button-row">
            <button
              type="button"
              className={attachment === "floor" ? "active" : ""}
              onClick={() => onAttachmentChange("floor")}
            >
              Floor
            </button>
            <button
              type="button"
              className={attachment === "back-wall" ? "active" : ""}
              onClick={() => onAttachmentChange("back-wall")}
            >
              Back Wall
            </button>
            <button
              type="button"
              className={attachment === "left-wall" ? "active" : ""}
              onClick={() => onAttachmentChange("left-wall")}
            >
              Left Wall
            </button>
            <button
              type="button"
              className={attachment === "right-wall" ? "active" : ""}
              onClick={() => onAttachmentChange("right-wall")}
            >
              Right Wall
            </button>
          </div>
        </div>
      ) : null}

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
        <div className="field-group">
          <label htmlFor="placement-y">Y</label>
          <input
            id="placement-y"
            type="number"
            step={snapSizeMm}
            value={inputs.placementY}
            onChange={(event) => handleNumericInputChange("placementY", event.currentTarget.value)}
            onBlur={() => handleBlur("placementY")}
          />
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
