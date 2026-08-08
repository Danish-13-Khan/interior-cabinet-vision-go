import { SCALE } from "./constants";

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

export function dimensionLabel(valueMm: number) {
  return `${Math.round(valueMm)}`;
}

export function dimTick(x: number, y: number, horizontal: boolean) {
  if (horizontal) {
    return line(x, y - 3, x, y + 3, `class="twod-dim" stroke="#334155" stroke-width="1"`);
  }
  return line(x - 3, y, x + 3, y, `class="twod-dim" stroke="#334155" stroke-width="1"`);
}

export function dimensionChainHorizontal(
  positionsMm: number[],
  labels: string[],
  ox: number,
  y: number,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const x0 = ox + positionsMm[0] / SCALE;
  const x1 = ox + positionsMm[positionsMm.length - 1] / SCALE;
  elements.push(line(x0, y, x1, y, `class="twod-dim" stroke="#334155" stroke-width="1"`));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const x = ox + positionsMm[index] / SCALE;
    elements.push(dimTick(x, y, true));
    if (index < labels.length) {
      const mid = ox + (positionsMm[index] + positionsMm[index + 1]) / 2 / SCALE;
      elements.push(
        text(
          mid,
          y - 4,
          `${labels[index]} mm`,
          `class="twod-annotation" font-size="8" fill="#1e293b" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

/** positionsMm measured from floor upward */
export function dimensionChainVertical(
  positionsMm: number[],
  labels: string[],
  x: number,
  oy: number,
  roomHeightMm: number,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const floorY = oy + roomHeightMm / SCALE / 2;
  const toSvgY = (mmFromFloor: number) => floorY - mmFromFloor / SCALE;

  const y0 = toSvgY(positionsMm[0]);
  const y1 = toSvgY(positionsMm[positionsMm.length - 1]);
  elements.push(line(x, y0, x, y1, `class="twod-dim" stroke="#334155" stroke-width="1"`));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const y = toSvgY(positionsMm[index]);
    elements.push(dimTick(x, y, false));
    if (index < labels.length) {
      const mid = (toSvgY(positionsMm[index]) + toSvgY(positionsMm[index + 1])) / 2;
      elements.push(
        text(
          x - 4,
          mid + 3,
          `${labels[index]} mm`,
          `class="twod-annotation" font-size="8" fill="#1e293b" text-anchor="end" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}
