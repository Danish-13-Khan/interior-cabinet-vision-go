import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

const RENDER_SCALE = 1.25;

function ensureBrowserWorker() {
  if (GlobalWorkerOptions.workerSrc) return;
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
}

export type PdfInfo = {
  pageCount: number;
  bytes: Uint8Array;
  fileName: string;
};

export async function loadPdfInfo(file: File): Promise<PdfInfo> {
  ensureBrowserWorker();
  const buf = new Uint8Array(await file.arrayBuffer());
  const task = getDocument({
    data: buf.slice(),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });
  const pdf = await task.promise;
  try {
    return { pageCount: pdf.numPages, bytes: buf, fileName: file.name };
  } finally {
    await pdf.destroy();
  }
}

/** Rasterize one PDF page to a PNG File for Vision. */
export async function rasterizePdfPageToPng(
  bytes: Uint8Array,
  pageNumber: number,
  fileName: string,
): Promise<File> {
  ensureBrowserWorker();
  if (pageNumber < 1) throw new Error("Page number must be ≥ 1.");
  const task = getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });
  const pdf = await task.promise;
  try {
    if (pageNumber > pdf.numPages) {
      throw new Error(`PDF has only ${pdf.numPages} page(s).`);
    }
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas for PDF raster.");
    await page.render({
      canvasContext: ctx,
      viewport,
      intent: "print",
      background: "rgb(255,255,255)",
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PDF raster encode failed."))),
        "image/png",
      );
    });
    const base = fileName.replace(/\.pdf$/i, "") || "floorplan";
    return new File([blob], `${base}-p${pageNumber}.png`, { type: "image/png" });
  } finally {
    await pdf.destroy();
  }
}
