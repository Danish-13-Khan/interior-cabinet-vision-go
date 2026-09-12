import { createEmptyLedger } from "./empty";
import { registerFrozenQuoteDocument } from "./documents";
import type { PaymentLedgerState } from "./types";

export const AS_OF = "2026-09-13T12:00:00.000Z";
export const YESTERDAY = "2026-09-12";
export const NEXT_MONTH = "2026-10-13";

export function seedQuoteDoc(
  total = 100_000,
  projectId = "proj-1",
): { state: PaymentLedgerState; documentId: string } {
  const { state, document } = registerFrozenQuoteDocument(createEmptyLedger(), {
    projectId,
    quoteSnapshotId: "quote-snap-1",
    revisionLabel: "A",
    total,
    clientId: "client-1",
    stamp: { actor: "owner", at: "2026-09-01T10:00:00.000Z" },
  });
  return { state, documentId: document.id };
}
