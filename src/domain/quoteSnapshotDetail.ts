/**
 * Per-line detail as issued. Frozen quotes keep their own lines so an issued
 * document stays as traceable as the draft it came from, and so a reviewer never
 * has to read live figures under an issued heading.
 */
export type QuoteSnapshotDetailLine = {
  kind: string;
  label: string;
  amount: number;
  detail?: string;
};

/** Guard against an unbounded document; a project past this is a data problem, not a quote. */
export const QUOTE_SNAPSHOT_DETAIL_LIMIT = 500;

/**
 * Repair rather than discard: a malformed stored line still represents money that
 * was issued, so it keeps a placeholder label instead of vanishing from the total.
 */
export function clampQuoteSnapshotDetailLines(
  lines: unknown,
): QuoteSnapshotDetailLine[] | undefined {
  if (!Array.isArray(lines)) return undefined;
  const clamped = lines
    .slice(0, QUOTE_SNAPSHOT_DETAIL_LIMIT)
    .map((line: Partial<QuoteSnapshotDetailLine> | null) => ({
      kind: String(line?.kind ?? "line").trim().slice(0, 24) || "line",
      label: String(line?.label ?? "").trim().slice(0, 160) || "Line",
      amount: Math.round(Number(line?.amount) || 0),
      ...(line?.detail ? { detail: String(line.detail).trim().slice(0, 240) } : {}),
    }));
  return clamped.length > 0 ? clamped : undefined;
}
