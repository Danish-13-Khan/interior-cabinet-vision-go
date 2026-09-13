import { entitlementsForPlan } from "../saas/entitlements";
import { createEmptyLedger } from "./empty";
import { registerFrozenQuoteDocument } from "./documents";
import { setPaymentSchedule } from "./schedule";
import type { PaymentInstalment } from "./types";
import type { PaymentMutationGate } from "./gate";
import type { PaymentLedgerState } from "./types";

export const AS_OF = "2026-09-13T12:00:00.000Z";
export const YESTERDAY = "2026-09-12";
export const NEXT_MONTH = "2026-10-13";

export const proGate: PaymentMutationGate = {
  entitlements: entitlementsForPlan("professional"),
};

export const designerGate: PaymentMutationGate = {
  entitlements: entitlementsForPlan("designer"),
};

export const companyGate: PaymentMutationGate = {
  entitlements: entitlementsForPlan("company"),
};

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

export function seedQuoteWithSchedule(
  total = 100_000,
  instalments: Array<Partial<PaymentInstalment>> = [
    { id: "i1", label: "Booking", amount: 20_000, dueDate: YESTERDAY },
    { id: "i2", label: "Balance", amount: 80_000, dueDate: NEXT_MONTH },
  ],
  projectId = "proj-1",
): { state: PaymentLedgerState; documentId: string } {
  const seeded = seedQuoteDoc(total, projectId);
  const scheduled = setPaymentSchedule(seeded.state, {
    documentId: seeded.documentId,
    instalments,
    stamp: { actor: "owner", at: AS_OF },
  });
  return { state: scheduled.state, documentId: seeded.documentId };
}
