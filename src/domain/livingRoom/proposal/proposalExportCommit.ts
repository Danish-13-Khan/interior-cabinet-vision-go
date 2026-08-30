import type { QuoteSnapshot } from "../../quoteSettings";
import type { ProposalStaleOverride } from "./types";

export function proposalExportCommit(input: {
  saved: boolean;
  staleOverride: boolean;
  frozen: QuoteSnapshot | null;
  now?: string;
}): { persistOverride: boolean; override: ProposalStaleOverride | null } {
  if (!input.saved || !input.staleOverride || !input.frozen) {
    return { persistOverride: false, override: null };
  }
  return {
    persistOverride: true,
    override: {
      snapshotId: input.frozen.id,
      reason: "Salesperson disclosed stale quote on proposal.",
      overriddenAt: input.now ?? new Date().toISOString(),
    },
  };
}
