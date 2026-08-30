export function sanitizeProposalFileToken(value: string, fallback: string) {
  const token = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return token || fallback;
}

/** Deterministic, filesystem-safe proposal PDF name. */
export function proposalFileName(input: {
  projectNumber?: string;
  projectName?: string;
  revision?: string;
  quoteSnapshotId?: string;
  draft?: boolean;
}) {
  const project = sanitizeProposalFileToken(
    input.projectNumber || input.projectName || "",
    "proposal",
  );
  const revision = sanitizeProposalFileToken(input.revision || "a", "a");
  const quote = sanitizeProposalFileToken(input.quoteSnapshotId || "draft", "draft");
  const prefix = input.draft ? "draft-" : "";
  return `${prefix}${project}-rev-${revision}-proposal-${quote}.pdf`;
}
