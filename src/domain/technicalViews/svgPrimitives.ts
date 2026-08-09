export function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function shortLabel(value: string, max = 16) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs} />`;
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: string,
) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs} />`;
}

export function text(
  x: number,
  y: number,
  value: string,
  attrs: string,
) {
  return `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;
}

export function circle(cx: number, cy: number, r: number, attrs: string) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs} />`;
}

export function dimensionLabel(valueMm: number) {
  return `${Math.round(valueMm)}`;
}
