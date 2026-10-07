import { extractPdfPageTexts } from "./proposalPdfText";
import type { ProposalDocument } from "./types";

/** The words on the pages, as PDF.js reads them; the embedded font writes glyph ids, not Latin-1 bytes. */
export async function extractPdfText(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return (await extractPdfPageTexts(bytes)).join("\n");
}

export type ProposalVerification = {
  ok: boolean;
  missing: string[];
};

/** Confirm the PDF carries the frozen commercial identity without workshop jargon. */
export function verifyProposalPdfText(
  text: string,
  proposal: ProposalDocument,
): ProposalVerification {
  const required = [
    proposal.brand.name.toUpperCase(),
    proposal.draft ? "Draft Proposal" : "Proposal",
    proposal.customerName,
    proposal.projectNumber,
    `Rev ${proposal.revision}`,
    proposal.quoteSnapshotId,
    proposal.inclusions.slice(0, 24),
    proposal.exclusions.slice(0, 24),
    "Approval",
    "Customer signature",
  ];
  if (proposal.validUntil) required.push("Valid until");
  if (proposal.staleDisclosed) required.push("STALE");
  if (proposal.draft) required.push("DRAFT");
  for (const view of proposal.views) required.push(view.viewName);
  const missing = required.filter((item) => item && !text.includes(item));
  const leaked = ["cutlist", "kerf", "carcass", "CNC"].filter((word) =>
    text.toLowerCase().includes(word.toLowerCase()),
  );
  return {
    ok: missing.length === 0 && leaked.length === 0,
    missing: [...missing, ...leaked.map((word) => `jargon:${word}`)],
  };
}

export async function verifyProposalPdf(
  blob: Blob,
  proposal: ProposalDocument,
): Promise<ProposalVerification> {
  return verifyProposalPdfText(await extractPdfText(blob), proposal);
}
