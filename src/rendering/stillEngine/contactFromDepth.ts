/** Darken authored pixels that sit on a depth discontinuity (contact enrichment). */
export function applyContactFromDepth(
  plate: Uint8ClampedArray,
  depth: Uint8ClampedArray,
  width: number,
  height: number,
  strength = 0.28,
) {
  const row = width * 4;
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * row + x * 4;
      const below = index + row;
      const edge = Math.max(0, depth[below] - depth[index]) / 255;
      if (edge < 0.08) continue;
      const shade = 1 - edge * strength;
      plate[index] = Math.round(plate[index] * shade);
      plate[index + 1] = Math.round(plate[index + 1] * shade);
      plate[index + 2] = Math.round(plate[index + 2] * shade);
    }
  }
}
