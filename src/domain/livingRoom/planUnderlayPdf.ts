/**
 * Browser-safe PDF helpers for plan underlay import (Phase 5.1).
 * Does not touch proposalPdfRaster (Node + createRequire).
 */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import { normalizeCropRect, type PdfCropRect } from "./planUnderlayPdfCrop";

export { normalizeCropRect, type PdfCropRect } from "./planUnderlayPdfCrop";

export type PdfPagePreview = {
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
};

const PREVIEW_MAX_EDGE = 720;
const EXPORT_SCALE = 2;

let workerConfigured = false;

/** Vite-friendly worker; skip if already set (e.g. by another module). */
export function ensureBrowserPdfWorker(): void {
  if (typeof window === "undefined") return;
  if (workerConfigured || GlobalWorkerOptions.workerSrc) {
    workerConfigured = true;
    return;
  }
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  workerConfigured = true;
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<PDFDocumentProxy> {
  ensureBrowserPdfWorker();
  // Copy so pdf.js transfer/detach does not poison cached underlay bytes.
  const source = data instanceof Uint8Array ? data : new Uint8Array(data);
  const bytes = source.slice();
  const task = getDocument({
    data: bytes,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  return task.promise;
}

export async function getPdfPageCount(data: ArrayBuffer | Uint8Array): Promise<number> {
  const doc = await loadPdfDocument(data);
  try {
    return doc.numPages;
  } finally {
    await doc.destroy();
  }
}

function scaleForMaxEdge(width: number, height: number, maxEdge: number): number {
  const longest = Math.max(width, height, 1);
  return Math.min(1, maxEdge / longest);
}

async function renderPageToCanvas(
  page: PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.round(viewport.width));
  const height = Math.max(1, Math.round(viewport.height));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create a canvas for the PDF page.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  await page.render({
    canvasContext: context,
    viewport,
    intent: "display",
    background: "rgb(255,255,255)",
  }).promise;
  return canvas;
}

function cropCanvas(source: HTMLCanvasElement, crop: PdfCropRect): HTMLCanvasElement {
  const x = Math.max(0, Math.floor(crop.x));
  const y = Math.max(0, Math.floor(crop.y));
  const width = Math.max(1, Math.min(source.width - x, Math.ceil(crop.width)));
  const height = Math.max(1, Math.min(source.height - y, Math.ceil(crop.height)));
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const context = out.getContext("2d");
  if (!context) throw new Error("Could not crop the PDF page.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, x, y, width, height, 0, 0, width, height);
  return out;
}

export async function renderPdfPagePreview(
  data: ArrayBuffer | Uint8Array,
  pageNumber: number,
  maxEdge = PREVIEW_MAX_EDGE,
): Promise<PdfPagePreview> {
  const doc = await loadPdfDocument(data);
  try {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = scaleForMaxEdge(base.width, base.height, maxEdge);
    const canvas = await renderPageToCanvas(page, scale);
    return {
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL("image/png"),
    };
  } finally {
    await doc.destroy();
  }
}

/**
 * Raster selected page (optional crop in preview-pixel space mapped via
 * preview scale) to a PNG data URL suitable for LivingRoomPlanUnderlay.
 *
 * When `preview` is provided with `crop`, crop coordinates are interpreted in
 * that preview's pixel space and scaled up to the export render.
 */
export async function rasterPdfPageToDataUrl(
  data: ArrayBuffer | Uint8Array,
  pageNumber: number,
  options?: {
    crop?: PdfCropRect | null;
    /** Pixel size of the preview the crop was drawn on. */
    previewWidth?: number;
    previewHeight?: number;
    exportScale?: number;
  },
): Promise<{ dataUrl: string; width: number; height: number }> {
  const doc = await loadPdfDocument(data);
  try {
    const page = await doc.getPage(pageNumber);
    const exportScale = options?.exportScale ?? EXPORT_SCALE;
    const canvas = await renderPageToCanvas(page, exportScale);
    const cropInput = options?.crop ?? null;
    let crop: PdfCropRect | null = null;
    if (cropInput) {
      const previewW = options?.previewWidth ?? canvas.width;
      const previewH = options?.previewHeight ?? canvas.height;
      const sx = canvas.width / Math.max(1, previewW);
      const sy = canvas.height / Math.max(1, previewH);
      crop = normalizeCropRect(
        {
          x: cropInput.x * sx,
          y: cropInput.y * sy,
          width: cropInput.width * sx,
          height: cropInput.height * sy,
        },
        canvas.width,
        canvas.height,
      );
    }
    const finalCanvas = crop ? cropCanvas(canvas, crop) : canvas;
    return {
      dataUrl: finalCanvas.toDataURL("image/png"),
      width: finalCanvas.width,
      height: finalCanvas.height,
    };
  } finally {
    await doc.destroy();
  }
}
