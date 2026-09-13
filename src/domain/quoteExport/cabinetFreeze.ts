import type { CabinetProject } from "../cabinetDimensions";
import type { ProjectQuote } from "../projectQuote";
import { createQuoteSnapshotFromQuote } from "../projectQuote";
import { clampJobMeta, patchJobMeta } from "../jobMeta";
import type { PriceBook } from "../priceBook";
import { bumpRevisionLabel } from "../projectReview/operations";
import { ratesFingerprintFromBook } from "./ratesFingerprint";
import { createCabinetDesignFingerprint } from "./cabinetDesignFingerprint";
import { clampQuoteSnapshot, type QuoteSnapshot } from "../quoteSettings";

/** Cabinet-shell freeze used by Review workflow (extends quoteHistory, no proposal surface). */
export function freezeCabinetProjectQuote(args: {
  project: CabinetProject;
  quote: ProjectQuote;
  priceBook?: PriceBook | null;
}): { project: CabinetProject; snapshot: QuoteSnapshot } {
  const priceBook = args.priceBook ?? null;
  const ratesFingerprint = ratesFingerprintFromBook(args.project.preferences, priceBook);
  const designFingerprint = createCabinetDesignFingerprint(args.project);
  const history = args.project.quoteHistory ?? [];
  const latest = history[0];
  const stale = Boolean(
    latest &&
      (latest.sellTotal !== args.quote.sellTotal ||
        latest.cabinetCount !== args.quote.cabinetLines.length ||
        (latest.ratesFingerprint && latest.ratesFingerprint !== ratesFingerprint) ||
        (latest.designFingerprint && latest.designFingerprint !== designFingerprint) ||
        latest.revision !== args.quote.job.revision),
  );
  const jobBase = clampJobMeta(args.project.job);
  const alreadyAdvanced = Boolean(latest && latest.revision !== jobBase.revision);
  const nextRevision =
    stale && !alreadyAdvanced ? bumpRevisionLabel(jobBase.revision) : jobBase.revision;
  // clampQuoteSnapshot deep-copies nested lines so later edits to the live quote
  // cannot mutate an issued snapshot through a shared array reference.
  const snapshot = clampQuoteSnapshot({
    ...createQuoteSnapshotFromQuote({
      ...args.quote,
      job: { ...args.quote.job, revision: nextRevision },
    }),
    ratesFingerprint,
    designFingerprint,
    priceBookUpdatedAt: priceBook?.updatedAt,
  }) as QuoteSnapshot;
  const shouldMarkQuoted =
    !args.project.job?.status || args.project.job.status === "draft" || stale;
  return {
    snapshot,
    project: {
      ...args.project,
      // Full issued-quote retention (spec §6) — ledger docs reference snapshot ids.
      quoteHistory: [snapshot, ...history],
      job: patchJobMeta(jobBase, {
        revision: nextRevision,
        status: shouldMarkQuoted ? "quoted" : jobBase.status,
      }),
    },
  };
}
