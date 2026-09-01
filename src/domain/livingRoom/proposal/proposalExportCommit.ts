import type { QuoteSnapshot } from "../../quoteSettings";
import type { ProposalStaleOverride } from "./types";

export function proposalExportCommit(input: {
  saved: boolean;
  staleOverride: boolean;
  frozen: QuoteSnapshot | null;
  reason?: string;
  user?: string;
  now?: string;
}): { persistOverride: boolean; override: ProposalStaleOverride | null } {
  const reason = String(input.reason ?? "").trim();
  if (!input.saved || !input.staleOverride || !input.frozen || !reason) {
    return { persistOverride: false, override: null };
  }
  return {
    persistOverride: true,
    override: {
      snapshotId: input.frozen.id,
      reason: reason.slice(0, 280),
      overriddenAt: input.now ?? new Date().toISOString(),
    },
  };
}
