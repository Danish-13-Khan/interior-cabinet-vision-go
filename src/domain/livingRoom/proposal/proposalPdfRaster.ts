import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PdfMediaBox } from "./proposalPdfParse";
import { ProposalCanvasFactory, readCanvasPixels } from "./proposalPdfCanvas";
import {
  countImagePaints,
  measureInkBounds,
  measureViewInk,
  pageTextMetrics,
  type RasterBound,
  type ViewInk,
} from "./proposalPdfViewInk";

export type RasterizedPdfPage = {
  width: number;
  height: number;
  scale: number;
  pixels: Uint8ClampedArray;
  inkBounds: RasterBound | null;
  minFontPt: number | null;
  clipped: boolean;
  imagePaintCount: number;
  viewInk: ViewInk | null;
  mediaBox: PdfMediaBox;
  text: string;
};

const RENDER_SCALE = 2;

type NodeCreateRequire = (url: string) => { resolve: (id: string) => string };

async function ensurePdfWorker() {
  if (GlobalWorkerOptions.workerSrc) return;
  const nodeModule = "node:module";
  const { createRequire } = (await import(nodeModule)) as { createRequire: NodeCreateRequire };
  GlobalWorkerOptions.workerSrc = createRequire(import.meta.url).resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
  );
}

async function rasterizePdfPage(
  page: PDFPageProxy,
  canvasFactory: ProposalCanvasFactory,
  scale: number,
): Promise<RasterizedPdfPage> {
  const viewport = page.getViewport({ scale });
  const media = page.getViewport({ scale: 1 });
  const width = Math.max(1, Math.round(viewport.width));
  const height = Math.max(1, Math.round(viewport.height));
  const surface = canvasFactory.create(width, height);
  if (!surface.context) throw new Error("PDF canvas context missing");
  await page.render({
    canvasContext: surface.context,
    viewport,
    intent: "print",
    background: "rgb(255,255,255)",
  }).promise;
  const pixels = readCanvasPixels(surface.context, width, height);
  const text = await page.getTextContent();
  const ops = await page.getOperatorList();
  const items = text.items as Array<{
    str?: string;
    width?: number;
    height?: number;
    transform: number[];
  }>;
  const metrics = pageTextMetrics(items, page.view);
  canvasFactory.destroy(surface);
  return {
    width,
    height,
    scale,
    pixels,
    inkBounds: measureInkBounds(pixels, width, height),
    minFontPt: metrics.minFontPt,
    clipped: metrics.clipped,
    imagePaintCount: countImagePaints(ops.fnArray),
    viewInk: measureViewInk(pixels, width, height),
    mediaBox: { x: 0, y: 0, width: media.width, height: media.height },
    text: items.map((item) => item.str ?? "").join(" "),
  };
}

export async function rasterizePdfPages(
  bytes: Uint8Array,
  scale = RENDER_SCALE,
): Promise<RasterizedPdfPage[]> {
  await ensurePdfWorker();
  const canvasFactory = new ProposalCanvasFactory();
  const task = getDocument({
    data: bytes.slice(),
    CanvasFactory: ProposalCanvasFactory,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });
  const pdf = await task.promise;
  const pages: RasterizedPdfPage[] = [];
  try {
    for (let index = 1; index <= pdf.numPages; index += 1) {
      pages.push(await rasterizePdfPage(await pdf.getPage(index), canvasFactory, scale));
    }
  } finally {
    await pdf.destroy();
  }
  return pages;
}

export function isA4MediaBox(box: PdfMediaBox) {
  return Math.abs(box.width - 595.28) < 3 && Math.abs(box.height - 841.89) < 3;
}
