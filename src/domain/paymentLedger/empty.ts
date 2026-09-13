import type { PaymentLedgerState } from "./types";

export function createEmptyLedger(): PaymentLedgerState {
  return {
    schemaVersion: 1,
    documents: [],
    schedules: [],
    payments: [],
    audit: [],
  };
}
