import type { CabinetConfig, CabinetType } from "../cabinetDimensions";
import {
  CABINET_DEPTH_MAX_MM,
  CABINET_DEPTH_MIN_MM,
  CABINET_DEPTH_STEP_MM,
  CABINET_HEIGHT_MAX_MM,
  CABINET_HEIGHT_MIN_MM,
  CABINET_HEIGHT_STEP_MM,
  CABINET_WIDTH_MAX_MM,
  CABINET_WIDTH_MIN_MM,
  CABINET_WIDTH_STEP_MM,
  cabinetTypeLabels,
} from "../cabinetDimensions";
import { listEngineeredPresetsForFamily } from "../cabinetPresets";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import type { PropertySectionDef } from "./types";
import { appendOpeningsSection } from "./sectionsOpenings";
import { appendConstructionHardwareSections } from "./sectionsShop";
import { appendCompositionSections } from "./sectionsComposition";

export function getCabinetEditorSections(config: CabinetConfig): PropertySectionDef[] {
  const rules = getFamilyOpeningRules(config.type);
  const familyOptions = (Object.keys(cabinetTypeLabels) as CabinetType[]).map((type) => ({
    value: type,
    label: cabinetTypeLabels[type],
  }));
  const presetOptions = [
    { value: "", label: "Custom / current" },
    ...listEngineeredPresetsForFamily(config.type).map((preset) => ({
      value: preset.id,
      label: preset.label,
    })),
  ];

  const sections: PropertySectionDef[] = [
    {
      id: "identity",
      label: "Cabinet Spec",
      hint: "Family and engineered preset",
      fields: [
        {
          id: "family",
          label: "Family",
          type: "enum",
          options: familyOptions,
        },
        {
          id: "preset",
          label: "Preset",
          type: "enum",
          options: presetOptions,
          hint: "Applies engineered composition defaults",
        },
        {
          id: "specSummary",
          label: "Composition",
          type: "readonly",
        },
        {
          id: "familyRulesNote",
          label: "Family rules",
          type: "readonly",
          hint: rules.notes,
        },
      ],
    },
    {
      id: "dimensions",
      label: "Carcass",
      fields: [
        {
          id: "width",
          label: "Width",
          type: "number",
          unit: "mm",
          min: CABINET_WIDTH_MIN_MM,
          max: CABINET_WIDTH_MAX_MM,
          step: CABINET_WIDTH_STEP_MM,
        },
        {
          id: "height",
          label: "Height",
          type: "number",
          unit: "mm",
          min: CABINET_HEIGHT_MIN_MM,
          max: CABINET_HEIGHT_MAX_MM,
          step: CABINET_HEIGHT_STEP_MM,
        },
        {
          id: "depth",
          label: "Depth",
          type: "number",
          unit: "mm",
          min: CABINET_DEPTH_MIN_MM,
          max: CABINET_DEPTH_MAX_MM,
          step: CABINET_DEPTH_STEP_MM,
        },
      ],
    },
  ];

  appendOpeningsSection(sections, config);
  appendConstructionHardwareSections(sections, config);
  appendCompositionSections(sections, config);

  return sections;
}
