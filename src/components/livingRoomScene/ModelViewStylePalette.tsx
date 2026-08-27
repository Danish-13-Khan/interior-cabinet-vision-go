import { LIVING_ROOM_STYLE_PRESETS, type LivingRoomStyleId } from "../../domain/livingRoom";

type ModelViewStylePaletteProps = {
  activeStyleId: LivingRoomStyleId;
  activeStyleName: string;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
};

export function ModelViewStylePalette({
  activeStyleId,
  activeStyleName,
  onApplyStyle,
}: ModelViewStylePaletteProps) {
  return (
    <aside className="lr-style-palette" aria-label="Interior style presets">
      <header>
        <span>STYLE</span>
        <strong>{activeStyleName}</strong>
      </header>
      <div>
        {LIVING_ROOM_STYLE_PRESETS.map((style) => (
          <button
            type="button"
            key={style.id}
            className={style.id === activeStyleId ? "is-active" : ""}
            onClick={() => onApplyStyle(style.id)}
            aria-label={`Apply ${style.name}`}
          >
            <span className="lr-style-swatches">
              {style.swatches.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
            </span>
            <span>{style.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
