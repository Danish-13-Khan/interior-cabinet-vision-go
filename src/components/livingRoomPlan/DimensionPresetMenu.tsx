import type { Size3Mm } from "../../domain/interiorProject";

const PRESETS: Array<{ label: string; dimensions: Size3Mm }> = [
  { label: "1200 × 2400 × 600 mm", dimensions: { widthMm: 1200, heightMm: 2400, depthMm: 600 } },
  { label: "1500 × 2400 × 600 mm", dimensions: { widthMm: 1500, heightMm: 2400, depthMm: 600 } },
  { label: "1800 × 2400 × 600 mm", dimensions: { widthMm: 1800, heightMm: 2400, depthMm: 600 } },
  { label: "2100 × 2400 × 600 mm", dimensions: { widthMm: 2100, heightMm: 2400, depthMm: 600 } },
];

export function DimensionPresetMenu({ dimensions, onChange }: {
  dimensions: Size3Mm;
  onChange: (dimensions: Size3Mm) => void;
}) {
  const selected = PRESETS.find((preset) =>
    Object.entries(preset.dimensions).every(([key, value]) => dimensions[key as keyof Size3Mm] === value),
  );
  return <label className="lr-dimension-preset"><span>Common size</span><select aria-label="Common cabinet size" value={selected?.label ?? "custom"} onChange={(event) => {
    const preset = PRESETS.find((item) => item.label === event.target.value);
    if (preset) onChange(preset.dimensions);
  }}><option value="custom">Custom size</option>{PRESETS.map((preset) => <option key={preset.label} value={preset.label}>{preset.label}</option>)}</select></label>;
}
