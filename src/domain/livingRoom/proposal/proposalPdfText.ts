import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ensurePdfWorker } from "./proposalPdfWorker";

/**
 * Page texts through PDF.js, so an embedded Unicode font (glyph ids on the
 * wire) reads back as the words the page shows. No canvas is needed, so the
 * browser bundle can carry this where it cannot carry the rasteriser.
 */
export async function extractPdfPageTexts(bytes: Uint8Array): Promise<string[]> {
  await ensurePdfWorker();
  const pdf = await getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  }).promise;
  const texts: string[] = [];
  try {
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      texts.push((content.items as Array<{ str?: string }>).map((item) => item.str ?? "").join(" "));
    }
  } finally {
    await pdf.destroy();
  }
  return texts;
}
