import { useMemo, useState } from "react";
import { CabinetPropertyGrid } from "./CabinetPropertyGrid";
import {
  normalizeRotationAngle,
  supportsWallPlacement,
} from "../domain/cabinetDimensions";
import {
  PROPERTY_GROUP_LABELS,
  PROPERTY_GROUP_ORDER,
  collectPropertyFieldIssues,
  getCabinetEditorSections,
  worstFieldSeverity,
  type PropertyGroupId,
} from "../domain/cabinetEditorSchema";
import { clampProjectStandards } from "../domain/projectStandards";
import { ManufacturingRulesSection } from "./dimensionControls/ManufacturingRulesSection";
import { TemplatesSection } from "./dimensionControls/TemplatesSection";
import { PlacementSection } from "./dimensionControls/PlacementSection";
import { PartsSection } from "./dimensionControls/PartsSection";
import { useNumericInputs } from "./dimensionControls/useNumericInputs";
import type { DimensionControlsProps } from "./dimensionControls/types";
import { CabinetAssemblyEditor } from "./CabinetAssemblyEditor";

export type { DimensionControlsProps } from "./dimensionControls/types";

export function DimensionControls({
  config,
  snapSizeMm,
  activeCabinetId,
  activeOpeningId,
  selectedPlacement,
  preferences,
  manufacturingIssues,
  constructionParts,
  onAttachmentChange,
  onConfigChange,
  onSelectOpening,
  onPlacementChange,
  onSaveCabinetTemplate,
  onRotationChange,
}: DimensionControlsProps) {
  const [activeGroup, setActiveGroup] = useState<PropertyGroupId>("dimensions");
  const { inputs, handleNumericInputChange, handleBlur } = useNumericInputs(
    config,
    selectedPlacement,
    onConfigChange,
    onPlacementChange,
  );

  const projectStandards = clampProjectStandards(preferences.standards);
  const fieldIssues = useMemo(
    () =>
      collectPropertyFieldIssues(config, manufacturingIssues, projectStandards),
    [config, manufacturingIssues, projectStandards],
  );
  const schemaGroups = useMemo(() => {
    const present = new Set(
      getCabinetEditorSections(config).map((section) => section.group),
    );
    return PROPERTY_GROUP_ORDER.filter(
      (group) =>
        group === "placement" ||
        group === "reports" ||
        present.has(group),
    );
  }, [config]);

  const resolvedGroup = schemaGroups.includes(activeGroup)
    ? activeGroup
    : schemaGroups[0] ?? "dimensions";

  const placementSeverity = worstFieldSeverity([
    ...(fieldIssues.attachment ?? []),
    ...(fieldIssues.placementY ?? []),
  ]);

  const showWallTools = supportsWallPlacement(config.type);
  const attachment = selectedPlacement?.attachment ?? "floor";
  const rotation = normalizeRotationAngle(selectedPlacement?.rotation ?? 0);

  if (!activeCabinetId) {
    return (
      <div className="controls-card engineering-panel">
        <div className="controls-header">
          <h1>Cabinet</h1>
          <p>Select a cabinet to edit engineering properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="controls-card engineering-panel">
      <div className="controls-header">
        <h1>Engineering</h1>
        <p>
          {PROPERTY_GROUP_LABELS[resolvedGroup]} · constrained fields & family presets
        </p>
      </div>

      <ManufacturingRulesSection manufacturingIssues={manufacturingIssues} />

      <div className="engineering-group-nav" role="tablist" aria-label="Engineering groups">
        {schemaGroups.map((group) => (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={resolvedGroup === group}
            className={`engineering-group-tab ${resolvedGroup === group ? "is-active" : ""} ${group === "placement" && placementSeverity ? `has-${placementSeverity}` : ""}`}
            onClick={() => setActiveGroup(group)}
          >
            {PROPERTY_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      <div className="controls-form engineering-group-body">
        {resolvedGroup === "placement" ? (
          <PlacementSection
            showWallTools={showWallTools}
            attachment={attachment}
            rotation={rotation}
            snapSizeMm={snapSizeMm}
            inputs={inputs}
            fieldIssues={fieldIssues}
            onRotationChange={onRotationChange}
            onAttachmentChange={onAttachmentChange}
            handleNumericInputChange={handleNumericInputChange}
            handleBlur={handleBlur}
          />
        ) : null}

        {resolvedGroup !== "placement" && resolvedGroup !== "reports" && resolvedGroup !== "openings" ? (
          <>
            {resolvedGroup === "dimensions" ? (
              <TemplatesSection onSaveCabinetTemplate={onSaveCabinetTemplate} />
            ) : null}
            <CabinetPropertyGrid
              config={config}
              onConfigChange={onConfigChange}
              manufacturingIssues={manufacturingIssues}
              projectStandards={projectStandards}
              activeGroup={resolvedGroup}
              hideGroupNav
            />
          </>
        ) : null}

        {resolvedGroup === "openings" ? (
          <CabinetAssemblyEditor
            config={config}
            activeOpeningId={activeOpeningId}
            onConfigChange={(next) => onConfigChange(next)}
            onSelectOpening={(openingId) => onSelectOpening?.(activeCabinetId, openingId)}
          />
        ) : null}

        {resolvedGroup === "reports" ? (
          <PartsSection constructionParts={constructionParts} />
        ) : null}
      </div>
    </div>
  );
}
