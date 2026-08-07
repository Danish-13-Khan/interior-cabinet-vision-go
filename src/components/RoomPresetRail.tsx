import { roomPresets, type RoomPresetId } from "../domain/roomPresets";

type RoomPresetRailProps = {
  onLoadPreset: (presetId: RoomPresetId) => void;
};

export function RoomPresetRail({ onLoadPreset }: RoomPresetRailProps) {
  return (
    <div className="rail-section">
      <div className="rail-section-title">Room Presets</div>
      <div className="preset-rail-list">
        {roomPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="palette-preset-btn"
            title={preset.description}
            onClick={() => onLoadPreset(preset.id)}
          >
            <span className="palette-preset-icon">
              {preset.id === "small-bedroom"
                ? "🛏"
                : preset.id === "living-room"
                  ? "🛋"
                  : "💼"}
            </span>
            <span className="palette-cat-label">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
