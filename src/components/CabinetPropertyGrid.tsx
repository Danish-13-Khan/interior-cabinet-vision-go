import type { CabinetConfig } from "../domain/cabinetDimensions";
import {
  applyCabinetEditorChange,
  getCabinetEditorSections,
  getCabinetEditorValue,
  type PropertyFieldDef,
  type PropertyFieldValue,
} from "../domain/cabinetEditorSchema";

type CabinetPropertyGridProps = {
  config: CabinetConfig;
  onConfigChange: (next: CabinetConfig | Partial<CabinetConfig>) => void;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: PropertyFieldDef;
  value: PropertyFieldValue;
  onChange: (next: PropertyFieldValue) => void;
}) {
  if (field.type === "readonly") {
    return <span className="property-grid-readonly">{String(value || "—")}</span>;
  }

  if (field.type === "action") {
    return (
      <button
        type="button"
        className="property-grid-action"
        onClick={() => onChange(true)}
        title={field.hint}
      >
        {field.actionLabel ?? field.label}
      </button>
    );
  }

  if (field.type === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.currentTarget.checked)}
        aria-label={field.label}
      />
    );
  }

  if (field.type === "enum") {
    return (
      <select
        value={String(value)}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={field.label}
      >
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span className="property-grid-number">
      <input
        type="number"
        value={Number.isFinite(Number(value)) ? Number(value) : 0}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        aria-label={field.label}
      />
      {field.unit ? <em>{field.unit}</em> : null}
    </span>
  );
}

export function CabinetPropertyGrid({ config, onConfigChange }: CabinetPropertyGridProps) {
  const sections = getCabinetEditorSections(config);

  function handleFieldChange(fieldId: string, value: PropertyFieldValue) {
    onConfigChange(applyCabinetEditorChange(config, fieldId, value));
  }

  return (
    <div className="cabinet-property-grid">
      {sections.map((section) => (
        <section key={section.id} className="property-grid-section">
          <header className="property-grid-section-header">
            <h2>{section.label}</h2>
            {section.hint ? <span>{section.hint}</span> : null}
          </header>
          <div className="property-grid-rows">
            {section.fields.map((field) => (
              <label key={field.id} className="property-grid-row" title={field.hint}>
                <span className="property-grid-label">{field.label}</span>
                <span className="property-grid-control">
                  <FieldControl
                    field={field}
                    value={getCabinetEditorValue(config, field.id)}
                    onChange={(next) => handleFieldChange(field.id, next)}
                  />
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
