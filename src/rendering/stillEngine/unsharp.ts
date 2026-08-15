/** Mild unsharp mask (material micro-detail). Amount is 0–1. */
export function applyUnsharp(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  amount = 0.42,
) {
  const copy = new Uint8ClampedArray(pixels);
  const row = width * 4;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * row + x * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = copy[index + channel];
        const blur = (
          copy[index - row + channel]
          + copy[index + row + channel]
          + copy[index - 4 + channel]
          + copy[index + 4 + channel]
          + center * 4
        ) / 8;
        pixels[index + channel] = Math.max(
          0,
          Math.min(255, Math.round(center + (center - blur) * amount)),
        );
      }
    }
  }
}
