import type { CabinetConfig, CabinetType } from "../cabinetDimensions";
import {
  CABINET_DEPTH_STEP_MM,
  CABINET_HEIGHT_STEP_MM,
  CABINET_WIDTH_STEP_MM,
  cabinetTypeLabels,
} from "../cabinetDimensions";
import { listEngineeredPresetsForFamily } from "../cabinetPresets";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import { getFamilyDimensionLimits } from "../manufacturingRules";
import type { PropertySectionDef } from "./types";
import { appendOpeningsSection } from "./sectionsOpenings";
import { appendConstructionHardwareSections } from "./sectionsShop";
import { appendCompositionSections } from "./sectionsComposition";
import { appendMaterialsSection } from "./sectionsMaterials";

export function getCabinetEditorSections(config: CabinetConfig): PropertySectionDef[] {
  const rules = getFamilyOpeningRules(config.type);
  const limits = getFamilyDimensionLimits(config.type);
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
      group: "dimensions",
      label: "Cabinet Spec",
      hint: `${cabinetTypeLabels[config.type]} · engineered presets`,
      fields: [
        {
          id: "family",
          label: "Family",
          type: "enum",
          options: familyOptions,
          hint: "Changing family resets to family defaults",
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
      group: "dimensions",
      label: "Carcass",
      hint: `Preferred ${limits.width.preferredMin}–${limits.width.preferredMax} × ${limits.height.preferredMin}–${limits.height.preferredMax} × ${limits.depth.preferredMin}–${limits.depth.preferredMax} mm`,
      fields: [
        {
          id: "width",
          label: "Width",
          type: "number",
          unit: "mm",
          min: limits.width.min,
          max: limits.width.max,
          step: CABINET_WIDTH_STEP_MM,
          hint: `Preferred ${limits.width.preferredMin}–${limits.width.preferredMax}`,
        },
        {
          id: "height",
          label: "Height",
          type: "number",
          unit: "mm",
          min: limits.height.min,
          max: limits.height.max,
          step: CABINET_HEIGHT_STEP_MM,
          hint: `Preferred ${limits.height.preferredMin}–${limits.height.preferredMax}`,
        },
        {
          id: "depth",
          label: "Depth",
          type: "number",
          unit: "mm",
          min: limits.depth.min,
          max: limits.depth.max,
          step: CABINET_DEPTH_STEP_MM,
          hint: `Preferred ${limits.depth.preferredMin}–${limits.depth.preferredMax}`,
        },
      ],
    },
  ];

  appendOpeningsSection(sections, config);
  appendConstructionHardwareSections(sections, config);
  appendCompositionSections(sections, config);
  appendMaterialsSection(sections, config);

  return sections;
}
