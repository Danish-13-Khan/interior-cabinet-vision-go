/** Shared SVG snippets for construction graphics. */

export function path(d: string, attrs: string) {
  return `<path d="${d}" ${attrs} />`;
}

export function circle(cx: number, cy: number, r: number, attrs: string) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs} />`;
}

/** Quarter-circle arc from (x1,y1) to (x2,y2) with center (cx,cy). */
export function quarterArcPath(
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sweep = 1,
) {
  const r = Math.hypot(x1 - cx, y1 - cy);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
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

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs} />`;
}
