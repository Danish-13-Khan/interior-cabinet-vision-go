import type { ProposalDocument } from "./types";

export function compactPdfText(text: string) {
  return text.replace(/[\s,\u00a0]/g, "");
}

/** Raster-page text must carry branded commercial identity, not just PDF bytes. */
export function verifyProposalVisualContent(
  pages: Array<{ text: string }>,
  proposal: ProposalDocument,
) {
  const text = pages.map((page) => page.text).join(" ");
  const compact = compactPdfText(text);
  const required = [
    proposal.brand.toUpperCase(),
    proposal.draft ? "Draft Proposal" : "Proposal",
    `Rev ${proposal.revision}`,
    proposal.inclusions.slice(0, 24),
    proposal.exclusions.slice(0, 24),
    "Approval",
    "Customer signature",
    "Inclusions",
    "Exclusions",
    "Materials and finishes",
  ];
  for (const view of proposal.views) required.push(view.viewName);
  for (const material of proposal.materials) {
    required.push(material.name);
    required.push(material.role);
  }
  const missing = required.filter((item) => item && !text.includes(item));
  if (!compact.includes(String(Math.round(proposal.sellTotal)))) {
    missing.push(`total:${Math.round(proposal.sellTotal)}`);
  }
  return { ok: missing.length === 0, missing };
}
