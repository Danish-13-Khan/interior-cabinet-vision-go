import { useMemo, useState } from "react";
import type { CabinetConfig } from "../domain/cabinetDimensions";
import type { ManufacturingIssue } from "../domain/manufacturingRules";
import type { ProjectStandards } from "../domain/projectStandards";
import {
  applyCabinetEditorChange,
  collectPropertyFieldIssues,
  getCabinetEditorSections,
  getCabinetEditorValue,
  PROPERTY_GROUP_LABELS,
  PROPERTY_GROUP_ORDER,
  worstFieldSeverity,
  type PropertyFieldDef,
  type PropertyFieldIssue,
  type PropertyFieldValue,
  type PropertyGroupId,
  type PropertySectionDef,
} from "../domain/cabinetEditorSchema";

type CabinetPropertyGridProps = {
  config: CabinetConfig;
  onConfigChange: (next: CabinetConfig | Partial<CabinetConfig>) => void;
  manufacturingIssues?: ManufacturingIssue[];
  projectStandards?: ProjectStandards | null;
  /** When set, only render sections for this engineering group. */
  activeGroup?: PropertyGroupId | null;
  hideGroupNav?: boolean;
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

function FieldIssueHint({ issues }: { issues: PropertyFieldIssue[] }) {
  if (issues.length === 0) return null;
  const primary = issues[0]!;
  return (
    <span className={`property-grid-issue severity-${primary.severity}`} title={issues.map((i) => i.message).join(" · ")}>
      {primary.message}
    </span>
  );
}

function SectionBlock({
  section,
  config,
  fieldIssues,
  onFieldChange,
}: {
  section: PropertySectionDef;
  config: CabinetConfig;
  fieldIssues: Record<string, PropertyFieldIssue[]>;
  onFieldChange: (fieldId: string, value: PropertyFieldValue) => void;
}) {
  return (
    <section className="property-grid-section" data-group={section.group}>
      <header className="property-grid-section-header">
        <h2>{section.label}</h2>
        {section.hint ? <span>{section.hint}</span> : null}
      </header>
      <div className="property-grid-rows">
        {section.fields.map((field) => {
          const issues = fieldIssues[field.id] ?? [];
          const severity = worstFieldSeverity(issues);
          return (
            <div
              key={field.id}
              className={`property-grid-row ${severity ? `has-${severity}` : ""}`}
              title={field.hint}
            >
              <span className="property-grid-label">{field.label}</span>
              <span className="property-grid-control">
                <FieldControl
                  field={field}
                  value={getCabinetEditorValue(config, field.id)}
                  onChange={(next) => onFieldChange(field.id, next)}
                />
              </span>
              <FieldIssueHint issues={issues} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CabinetPropertyGrid({
  config,
  onConfigChange,
  manufacturingIssues = [],
  projectStandards = null,
  activeGroup = null,
  hideGroupNav = false,
}: CabinetPropertyGridProps) {
  const sections = useMemo(() => getCabinetEditorSections(config), [config]);
  const fieldIssues = useMemo(
    () =>
      collectPropertyFieldIssues(config, manufacturingIssues, projectStandards),
    [config, manufacturingIssues, projectStandards],
  );

  const availableGroups = useMemo(() => {
    const present = new Set(sections.map((section) => section.group));
    return PROPERTY_GROUP_ORDER.filter((group) => present.has(group));
  }, [sections]);

  const [localGroup, setLocalGroup] = useState<PropertyGroupId | null>(null);
  const selectedGroup =
    activeGroup ??
    localGroup ??
    availableGroups[0] ??
    "dimensions";

  const visibleSections = sections.filter(
    (section) => section.group === selectedGroup,
  );

  function handleFieldChange(fieldId: string, value: PropertyFieldValue) {
    onConfigChange(
      applyCabinetEditorChange(config, fieldId, value, projectStandards),
    );
  }

  return (
    <div className="cabinet-property-grid">
      {!hideGroupNav && availableGroups.length > 1 ? (
        <div className="property-group-nav" role="tablist" aria-label="Property groups">
          {availableGroups.map((group) => {
            const groupIssues = sections
              .filter((section) => section.group === group)
              .flatMap((section) =>
                section.fields.flatMap((field) => fieldIssues[field.id] ?? []),
              );
            const severity = worstFieldSeverity(groupIssues);
            return (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={selectedGroup === group}
                className={`property-group-tab ${selectedGroup === group ? "is-active" : ""} ${severity ? `has-${severity}` : ""}`}
                onClick={() => setLocalGroup(group)}
              >
                {PROPERTY_GROUP_LABELS[group]}
                {severity ? <i aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {visibleSections.length === 0 ? (
        <p className="property-grid-empty">No fields for this group on this family.</p>
      ) : (
        visibleSections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            config={config}
            fieldIssues={fieldIssues}
            onFieldChange={handleFieldChange}
          />
        ))
      )}
    </div>
  );
}
