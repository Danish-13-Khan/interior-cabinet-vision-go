/**
 * The proposal's Unicode sans (roadmap D6): Noto Sans Regular and SemiBold,
 * subset to Latin-1 plus the rupee, euro, dashes, quotes and bullet
 * (`scripts/proposal-font/build_subset.py`). The TTFs ship in `public/fonts`
 * and load lazily at export: fetched in the browser, read from disk in Node.
 * Without them jsPDF's Helvetica prints and `pdfSafeText` spells the symbols.
 */

import type { jsPDF } from "jspdf";
import { publicAssetUrl } from "../../../utils/publicAssetUrl";
import { pdfSafeText } from "./proposalPdfDraw";
import type { ProposalTypeface } from "./proposalPdfTheme";

export const PROPOSAL_FONT_FAMILY = "NotoSansProposal";

const FILES = {
  normal: "fonts/NotoSansProposal-Regular.ttf",
  bold: "fonts/NotoSansProposal-SemiBold.ttf",
} as const;

/** Characters the subset carries; anything else would print as a missing-glyph box. */
const SUBSET = /[^ -~ -ÿ₹€–—‘’“”•…]/g;

export function embeddedSafeText(text: string): string {
  return text.replace(SUBSET, "");
}

function toBinaryString(bytes: Uint8Array): string {
  let out = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    out += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return out;
}

async function readFontBytes(assetKey: string): Promise<Uint8Array | null> {
  try {
    if (typeof window !== "undefined" && typeof fetch === "function") {
      const response = await fetch(publicAssetUrl(assetKey));
      if (!response.ok) return null;
      return new Uint8Array(await response.arrayBuffer());
    }
    // Node (tests, proof scripts): read the same file from the repository's public folder.
    const fsModule = "node:fs/promises";
    const { readFile } = (await import(fsModule)) as { readFile: (path: URL) => Promise<Uint8Array> };
    return await readFile(new URL(`../../../../public/${assetKey}`, import.meta.url));
  } catch {
    return null;
  }
}

let binaries: Promise<Record<keyof typeof FILES, string> | null> | null = null;

/** Both weights as jsPDF binary strings, loaded once per session; null when either is missing. */
export function loadProposalFontBinaries() {
  binaries ??= (async () => {
    const [normal, bold] = await Promise.all([readFontBytes(FILES.normal), readFontBytes(FILES.bold)]);
    if (!normal || !bold) return null;
    return { normal: toBinaryString(normal), bold: toBinaryString(bold) };
  })();
  return binaries;
}

export const CORE_TYPEFACE: ProposalTypeface = { family: "helvetica", embedded: false, text: pdfSafeText };

/** Register the font on this document and return the typeface the pages write with. */
export async function registerProposalFont(doc: jsPDF): Promise<ProposalTypeface> {
  const fonts = await loadProposalFontBinaries();
  if (!fonts) return CORE_TYPEFACE;
  for (const style of ["normal", "bold"] as const) {
    const fileName = FILES[style].split("/").pop()!;
    doc.addFileToVFS(fileName, fonts[style]);
    doc.addFont(fileName, PROPOSAL_FONT_FAMILY, style);
  }
  return { family: PROPOSAL_FONT_FAMILY, embedded: true, text: embeddedSafeText };
}
