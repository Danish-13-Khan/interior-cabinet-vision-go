/**
 * Company time/money helpers.
 * Money: whole rupees (integer) — aligned with paymentLedger.money (not paise).
 */
export function companyNowIso(at?: string): string {
  return at ?? new Date().toISOString();
}

/** Round to whole rupees — same contract as paymentLedger `money()`. */
export function companyMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}
