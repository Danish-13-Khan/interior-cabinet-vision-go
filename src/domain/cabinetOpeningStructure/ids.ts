let openingIdCounter = 0;

export function nextOpeningId(prefix: string) {
  openingIdCounter += 1;
  return `${prefix}-${openingIdCounter}`;
}

export function resetOpeningIdCounterForTests() {
  openingIdCounter = 0;
}

export function clampRatio(value: number, fallback = 0.5): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(0.95, Math.max(0.05, value));
}
