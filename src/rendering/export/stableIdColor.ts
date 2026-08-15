/** Stable 24-bit color from an authored id (material / object). */
export function colorFromStableId(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash & 0xffffff;
}

export function rgbFromStableId(id: string) {
  const packed = colorFromStableId(id);
  return {
    r: (packed >> 16) & 255,
    g: (packed >> 8) & 255,
    b: packed & 255,
  };
}
