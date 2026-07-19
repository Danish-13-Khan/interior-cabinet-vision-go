import { useEffect, useState } from "react";
import {
  ROOM_WIDTH_MIN_MM,
  ROOM_WIDTH_MAX_MM,
  ROOM_DEPTH_MIN_MM,
  ROOM_DEPTH_MAX_MM,
  ROOM_HEIGHT_MIN_MM,
  ROOM_HEIGHT_MAX_MM,
  WALL_THICKNESS_MIN_MM,
  WALL_THICKNESS_MAX_MM,
  clampRoomDimensions,
  type RoomDimensions,
} from "../domain/roomModel";

type RoomSettingsProps = {
  dimensions: RoomDimensions;
  onChange: (dims: RoomDimensions) => void;
};

export function RoomSettings({ dimensions, onChange }: RoomSettingsProps) {
  const [inputs, setInputs] = useState({
    width: String(dimensions.widthMm),
    depth: String(dimensions.depthMm),
    height: String(dimensions.heightMm),
    wall: String(dimensions.wallThicknessMm),
  });

  useEffect(() => {
    setInputs({
      width: String(dimensions.widthMm),
      depth: String(dimensions.depthMm),
      height: String(dimensions.heightMm),
      wall: String(dimensions.wallThicknessMm),
    });
  }, [dimensions]);

  function commit(field: keyof RoomDimensions, raw: string) {
    const val = Number(raw);
    if (!Number.isFinite(val)) return;
    const next = clampRoomDimensions({ ...dimensions, [field]: val });
    setInputs((prev) => ({ ...prev, [field === "wallThicknessMm" ? "wall" : field === "widthMm" ? "width" : field === "depthMm" ? "depth" : "height"]: String(next[field]) }));
    onChange(next);
  }

  const inputClass = "room-input";

  return (
    <div className="control-section room-settings">
      <div className="section-heading">
        <h2>Room Dimensions</h2>
        <span>{dimensions.widthMm} × {dimensions.depthMm} × {dimensions.heightMm} mm</span>
      </div>
      <div className="room-fields">
        <div className="field-group">
          <label>Width (mm)</label>
          <input
            className={inputClass}
            type="number"
            min={ROOM_WIDTH_MIN_MM}
            max={ROOM_WIDTH_MAX_MM}
            step={100}
            value={inputs.width}
            onChange={(e) => commit("widthMm", e.currentTarget.value)}
          />
        </div>
        <div className="field-group">
          <label>Depth (mm)</label>
          <input
            className={inputClass}
            type="number"
            min={ROOM_DEPTH_MIN_MM}
            max={ROOM_DEPTH_MAX_MM}
            step={100}
            value={inputs.depth}
            onChange={(e) => commit("depthMm", e.currentTarget.value)}
          />
        </div>
        <div className="field-group">
          <label>Height (mm)</label>
          <input
            className={inputClass}
            type="number"
            min={ROOM_HEIGHT_MIN_MM}
            max={ROOM_HEIGHT_MAX_MM}
            step={100}
            value={inputs.height}
            onChange={(e) => commit("heightMm", e.currentTarget.value)}
          />
        </div>
        <div className="field-group">
          <label>Wall Thickness (mm)</label>
          <input
            className={inputClass}
            type="number"
            min={WALL_THICKNESS_MIN_MM}
            max={WALL_THICKNESS_MAX_MM}
            step={10}
            value={inputs.wall}
            onChange={(e) => commit("wallThicknessMm", e.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  );
}
