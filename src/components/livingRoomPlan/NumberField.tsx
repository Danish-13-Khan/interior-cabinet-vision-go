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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  unit?: string;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(Math.round(value)));
  }, [value]);

  function apply(raw: string) {
    setDraft(raw);
    const next = parseMmDraft(raw);
    if (next === null || Math.round(next) === Math.round(value)) return;
    onChange(next);
  }

  function commit() {
    const next = parseMmDraft(draft);
    if (next === null) {
      setDraft(String(Math.round(value)));
      return;
    }
    if (Math.round(next) !== Math.round(value)) onChange(next);
  }

  return (
    <label className={`lr-number-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <input
        type="number"
        aria-label={`${label} ${unit}`}
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
            setDraft(String(Math.round(value)));
            event.currentTarget.blur();
          }
        }}
      />
      <small>{unit}</small>
    </label>
  );
}
