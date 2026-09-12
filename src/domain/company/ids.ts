export function companyNowIso(at?: string): string {
  return at ?? new Date().toISOString();
}

export function companyMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}
