export function createLedgerId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function nowIso(stamp?: string): string {
  return stamp ?? new Date().toISOString();
}

/** Compare calendar due dates; ignores time-of-day when possible. */
export function dueDateValue(iso: string): number {
  const day = iso.slice(0, 10);
  const t = Date.parse(day.length === 10 ? `${day}T00:00:00.000Z` : iso);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export function isDueDatePast(dueDate: string, asOfIso: string): boolean {
  const due = dueDateValue(dueDate);
  const asOf = dueDateValue(asOfIso);
  return due < asOf;
}

export function money(n: number): number {
  return Math.round(Number(n) || 0);
}
