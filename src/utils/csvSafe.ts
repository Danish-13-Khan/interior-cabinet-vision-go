/**
 * CSV cell encoding for documents our customers hand to clients and accountants.
 *
 * Two separate concerns:
 * 1. Delimiter safety — quote the field and double any embedded quote.
 * 2. Formula injection — Excel, LibreOffice and Sheets evaluate a cell whose
 *    text begins with = + - @ (or a leading tab / CR), even inside quotes. A
 *    customer name like `=HYPERLINK(...)` would run on open, so those values
 *    are prefixed with a single quote to force text.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function csvSafeValue(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return FORMULA_TRIGGER.test(text) ? `'${text}` : text;
}

/** Quote every field (stable diffs) and neutralise formula triggers. */
export function csvQuotedCell(value: string | number | null | undefined): string {
  return `"${csvSafeValue(value).replace(/"/g, '""')}"`;
}

/** Quote only when needed, for exports that prefer bare fields. */
export function csvMinimalCell(value: string | number | null | undefined): string {
  const text = csvSafeValue(value);
  return /["',\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvRowToLine(
  row: Array<string | number | null | undefined>,
): string {
  return row.map(csvQuotedCell).join(",");
}
