import type { InteriorProject } from "../../interiorProject";
import type { PriceBook } from "../../priceBook";
import { bumpRevisionLabel } from "../../projectReview/operations";
import {
  canFreezeQuotesFromEntitlements,
  gateFreezeQuotes,
} from "../../quoteExport";
import type { PlanEntitlements } from "../../saas/entitlements";
import { appendFrozenQuote, patchProposalJob, readProposalCommercial } from "./commercialState";
import { buildLiveInteriorQuote, freezeLiveQuote } from "./liveQuote";
import { buildProposalClientPayload } from "./proposalClientPayload";

export type FreezeProposalOptions = {
  now?: string;
  snapshotId?: string;
  priceBook?: PriceBook | null;
  /** When omitted, freeze is allowed (unit tests / legacy). UI must pass entitlements. */
  entitlements?: Pick<PlanEntitlements, "canFreezeQuotes"> | null;
  /** Bump job revision when re-freezing a stale issued quote (basic revisions). */
  bumpRevisionWhenStale?: boolean;
};

export type FreezeProposalResult =
  | { ok: true; document: InteriorProject }
  | { ok: false; reason: string };

function prepareRevision(
  document: InteriorProject,
  options: FreezeProposalOptions,
  now: string,
): InteriorProject {
  if (options.bumpRevisionWhenStale === false) return document;
  const live = buildLiveInteriorQuote(document, now, { priceBook: options.priceBook });
  if (!live.frozen || !live.stale) return document;
  // User already advanced the revision label — do not double-bump.
  if (live.frozen.revision !== live.quote.job.revision) return document;
  const nextRevision = bumpRevisionLabel(live.quote.job.revision);
  return patchProposalJob(document, { revision: nextRevision });
}

/** Freeze without entitlement check (tests / internal). Prefer tryFreezeProposal in UI. */
export function freezeProposal(
  document: InteriorProject,
  now = new Date().toISOString(),
  snapshotId?: string,
  options: Omit<FreezeProposalOptions, "now" | "snapshotId"> = {},
): InteriorProject {
  const prepared = prepareRevision(document, { ...options, now, snapshotId }, now);
  const snapshot = freezeLiveQuote(prepared, now, snapshotId, {
    priceBook: options.priceBook,
  });
  return appendFrozenQuote(
    prepared,
    snapshot,
    buildProposalClientPayload(prepared, snapshot.id, { priceBook: options.priceBook }),
  );
}

export function tryFreezeProposal(
  document: InteriorProject,
  options: FreezeProposalOptions = {},
): FreezeProposalResult {
  if (options.entitlements !== undefined) {
    const gate = gateFreezeQuotes(options.entitlements);
    if (!gate.ok) return gate;
  }
  const now = options.now ?? new Date().toISOString();
  if (buildLiveInteriorQuote(document, now, { priceBook: options.priceBook }).missingRate) {
    return { ok: false, reason: "Enter missing rates or explicitly exclude those items before freezing the quote." };
  }
  return {
    ok: true,
    document: freezeProposal(document, now, options.snapshotId, options),
  };
}

export function freezeAllowed(
  entitlements: Pick<PlanEntitlements, "canFreezeQuotes"> | null | undefined,
): boolean {
  return canFreezeQuotesFromEntitlements(entitlements);
}

export function issuedQuoteIntact(
  document: InteriorProject,
  snapshotId: string,
): boolean {
  const { quoteHistory } = readProposalCommercial(document);
  return quoteHistory.some((snap) => snap.id === snapshotId);
}
