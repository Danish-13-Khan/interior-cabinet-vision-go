const PREVIEW_PX = 1600;

type PreviewSvg = {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  layers: { name: string; paths: { d: string; matrix: number[]; fill?: boolean }[] }[];
};

/** Raster-friendly SVG: CAD-sized width/height makes stroke vanish in the dialog. */
export function dwgPreviewDataUrl(preview: PreviewSvg, hidden: string[] = []): string {
  const b = preview.bounds;
  const width = b.maxX - b.minX;
  const height = b.maxY - b.minY;
  const scale = PREVIEW_PX / Math.max(width, height, 1);
  const svgW = Math.max(1, width * scale);
  const svgH = Math.max(1, height * scale);
  const stroke = Math.max(width, height) / 700;
  const paths = preview.layers.filter((layer) => !hidden.includes(layer.name)).flatMap((layer) => layer.paths)
    .map(({ d, matrix, fill }) => `<path d="${d}" transform="matrix(${matrix.join(" ")})" fill="${fill ? "#263238" : "none"}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${-b.maxY} ${width} ${height}" width="${svgW}" height="${svgH}"><g transform="scale(1 -1)" stroke="#263238" stroke-width="${stroke}" stroke-linecap="round">${paths}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
