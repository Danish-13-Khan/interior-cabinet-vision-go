import type { PdfInfo } from "./pdfPageRaster";
import { resolveLabUpload } from "./labUpload";

type UploadSetters = {
  setFile: (f: File | null) => void;
  setFileName: (n: string | null) => void;
  setUploadError: (e: string | null) => void;
  setPreviewUrl: (fn: (prev: string | null) => string | null) => void;
  setPdfInfo: (info: PdfInfo | null) => void;
  setPdfPage: (n: number) => void;
  setImageFile: (f: File) => void;
  resetExtract: () => void;
};

export async function handleLabFilePick(next: File | null, s: UploadSetters) {
  s.resetExtract();
  s.setPdfInfo(null);
  if (!next) {
    s.setFile(null);
    s.setFileName(null);
    s.setUploadError(null);
    s.setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    return;
  }
  const resolved = await resolveLabUpload(next);
  if (resolved.kind === "error") {
    s.setUploadError(resolved.error);
    s.setFile(null);
    s.setFileName(null);
    s.setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    return;
  }
  if (resolved.kind === "pdf") {
    s.setPdfInfo(resolved.info);
    s.setPdfPage(1);
    s.setFile(null);
    s.setFileName(next.name);
    s.setUploadError(null);
    s.setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    return;
  }
  s.setImageFile(resolved.file);
}
