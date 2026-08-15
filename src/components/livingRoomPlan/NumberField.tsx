import { useEffect, useState } from "react";

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  useEffect(() => setDraft(String(Math.round(value))), [value]);

  function commit() {
    const next = Number(draft);
    if (draft.trim() && Number.isFinite(next)) onChange(next);
    else setDraft(String(Math.round(value)));
  }

  return (
    <label className="lr-number-field">
      <span>{label}</span>
      <input
        type="number"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(Math.round(value)));
            event.currentTarget.blur();
          }
        }}
      />
      <small>mm</small>
    </label>
  );
}
