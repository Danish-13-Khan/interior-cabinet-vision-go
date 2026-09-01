/** Shop-facing W × H × D from millimetre truth. */
export function formatWhdMm(widthMm: number, heightMm: number, depthMm: number) {
  return `${widthMm} × ${heightMm} × ${depthMm}`;
}

export function cutlistWidthSumMm(lines: ReadonlyArray<{ widthMm: number }>) {
  return lines.reduce((sum, line) => sum + line.widthMm, 0);
}

/** Live production takeoff — part count plus width so a resize is visible. */
export function formatCutlistPartCount(marks: number, parts: number, widthSumMm: number) {
  return `${marks} cabinet marks · ${parts} cut parts · ${Math.round(widthSumMm)} mm cut width`;
}
