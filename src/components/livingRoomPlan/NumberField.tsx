import { useEffect, useRef, useState } from "react";

export function parseMmDraft(raw: string): number | null {
  if (!raw.trim()) return null;
  const next = Number(raw);
  return Number.isFinite(next) ? next : null;
}

export function NumberField({
  label,
  value,
  onChange,
  className,
  unit = "mm",
  precision = 0,
  testId,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  unit?: string;
  /** Decimal places kept when displaying and comparing (0 = whole units). */
  precision?: number;
  testId?: string;
}) {
  const factor = 10 ** precision;
  const rounded = (next: number) => Math.round(next * factor) / factor;
  const [draft, setDraft] = useState(String(rounded(value)));
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(Math.round(value * factor) / factor));
  }, [value, factor]);

  function apply(raw: string) {
    setDraft(raw);
    const next = parseMmDraft(raw);
    if (next === null || rounded(next) === rounded(value)) return;
    onChange(next);
  }

  function commit() {
    const next = parseMmDraft(draft);
    if (next !== null && rounded(next) !== rounded(value)) onChange(next);
    // Show the stored value; a clamped edit that leaves it unchanged would otherwise keep the typed text.
    setDraft(String(rounded(value)));
  }

  return (
    <label className={`lr-number-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <input
        type="number"
        aria-label={`${label} ${unit}`}
        data-testid={testId}
        step={precision > 0 ? 1 / factor : undefined}
        value={draft}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(event) => apply(event.target.value)}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(rounded(value)));
            event.currentTarget.blur();
          }
        }}
      />
      <small>{unit}</small>
    </label>
  );
}
