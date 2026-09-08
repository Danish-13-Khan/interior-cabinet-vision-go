/** Normalize colour strings for MaterialEntity.color (#rrggbb). */

export function normalizeHexColour(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

export function clampRgbChannel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (channel: number) => clampRgbChannel(channel).toString(16).padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColour(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

/** Accept HEX or RGB triple; returns normalized #rrggbb or null. */
export function resolveColourInput(args: {
  hex?: string;
  r?: number;
  g?: number;
  b?: number;
}): string | null {
  if (args.hex != null && args.hex.trim().length > 0) {
    return normalizeHexColour(args.hex);
  }
  if (args.r != null && args.g != null && args.b != null) {
    return rgbToHex(args.r, args.g, args.b);
  }
  return null;
}
