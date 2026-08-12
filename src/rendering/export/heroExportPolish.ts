/** Soft vignette overlay for hero PNG exports. */
export function drawHeroVignette(
  context: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  strength: number,
) {
  if (strength <= 0) return;
  const vignette = context.createRadialGradient(
    widthPx / 2,
    heightPx * 0.48,
    Math.min(widthPx, heightPx) * 0.22,
    widthPx / 2,
    heightPx / 2,
    Math.max(widthPx, heightPx) * 0.72,
  );
  vignette.addColorStop(0, "rgba(12,18,16,0)");
  vignette.addColorStop(0.68, "rgba(12,18,16,0.01)");
  vignette.addColorStop(1, `rgba(12,18,16,${strength})`);
  context.fillStyle = vignette;
  context.fillRect(0, 0, widthPx, heightPx);
}
