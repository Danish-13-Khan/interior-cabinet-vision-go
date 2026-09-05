import { guardFloorplanImage, guardFloorplanPdf } from "./imageGuards";
import { loadPdfInfo, type PdfInfo } from "./pdfPageRaster";

export type LabUploadResult =
  | { kind: "image"; file: File }
  | { kind: "pdf"; info: PdfInfo }
  | { kind: "error"; error: string };

export async function resolveLabUpload(file: File): Promise<LabUploadResult> {
  const pdfGuard = guardFloorplanPdf(file);
  if (pdfGuard.ok) {
    try {
      return { kind: "pdf", info: await loadPdfInfo(file) };
    } catch (e) {
      return { kind: "error", error: e instanceof Error ? e.message : "Could not read PDF" };
    }
  }
  const guard = guardFloorplanImage(file);
  if (!guard.ok) return { kind: "error", error: guard.error };
  return { kind: "image", file };
}
