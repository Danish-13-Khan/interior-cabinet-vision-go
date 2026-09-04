import { useId, useState, type ChangeEvent } from "react";

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

/** Password input with show/hide toggle. Visual only — no API calls. */
export function PasswordField({
  id,
  name = "password",
  label,
  value,
  placeholder = "••••••••",
  autoComplete = "current-password",
  onChange,
}: PasswordFieldProps) {
  const reactId = useId();
  const inputId = id ?? `password-${reactId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="password-field">
        <input
          className="form-input"
          type={visible ? "text" : "password"}
          id={inputId}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
