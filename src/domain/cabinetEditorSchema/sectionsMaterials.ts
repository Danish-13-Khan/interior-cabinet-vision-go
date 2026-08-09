import type { CabinetConfig } from "../cabinetDimensions";
import {
  BACK_PANEL_RULES,
  EDGE_BANDING_OPTIONS,
  FINISHES,
  GRAIN_LABELS,
  MATERIAL_PRESETS,
  THICKNESS_PRESETS,
} from "../materialSystem";
import { isStorageType } from "../cabinetCapabilities";
import type { PropertySectionDef } from "./types";

export function appendMaterialsSection(
  sections: PropertySectionDef[],
  config: CabinetConfig,
): void {
  if (!isStorageType(config.type) && !config.buildRules) return;

  sections.push({
    id: "materials",
    group: "materials",
    label: "Board & Finish",
    hint: "Controlled material presets — not free-form",
    fields: [
      {
        id: "materialPreset",
        label: "Material",
        type: "enum",
        options: MATERIAL_PRESETS.map((preset) => ({
          value: preset.id,
          label: preset.label,
        })),
      },
      {
        id: "finishId",
        label: "Finish",
        type: "enum",
        options: FINISHES.map((finish) => ({
          value: finish.id,
          label: finish.label,
        })),
      },
      {
        id: "edgeBandingId",
        label: "Edge banding",
        type: "enum",
        options: EDGE_BANDING_OPTIONS.map((edge) => ({
          value: edge.id,
          label: edge.label,
        })),
      },
      {
        id: "grainDirection",
        label: "Grain",
        type: "enum",
        options: (Object.keys(GRAIN_LABELS) as Array<keyof typeof GRAIN_LABELS>).map(
          (grain) => ({
            value: grain,
            label: GRAIN_LABELS[grain],
          }),
        ),
      },
      {
        id: "backPanelType",
        label: "Back rule",
        type: "enum",
        options: (Object.keys(BACK_PANEL_RULES) as Array<keyof typeof BACK_PANEL_RULES>).map(
          (rule) => ({
            value: rule,
            label: rule,
          }),
        ),
      },
      {
        id: "carcassThicknessMm",
        label: "Carcass thk",
        type: "enum",
        unit: "mm",
        options: THICKNESS_PRESETS.filter((preset) => preset.usage === "carcass").map(
          (preset) => ({
            value: String(preset.valueMm),
            label: preset.label,
          }),
        ),
      },
      {
        id: "backPanelThicknessMm",
        label: "Back thk",
        type: "enum",
        unit: "mm",
        options: THICKNESS_PRESETS.filter((preset) => preset.usage === "back").map(
          (preset) => ({
            value: String(preset.valueMm),
            label: preset.label,
          }),
        ),
      },
      {
        id: "shelfThicknessMm",
        label: "Shelf thk",
        type: "enum",
        unit: "mm",
        options: THICKNESS_PRESETS.filter((preset) => preset.usage === "shelf").map(
          (preset) => ({
            value: String(preset.valueMm),
            label: preset.label,
          }),
        ),
      },
      {
        id: "drawerBoxThicknessMm",
        label: "Drawer box thk",
        type: "enum",
        unit: "mm",
        options: THICKNESS_PRESETS.filter((preset) => preset.usage === "drawer").map(
          (preset) => ({
            value: String(preset.valueMm),
            label: preset.label,
          }),
        ),
      },
      {
        id: "applyProjectStandards",
        label: "Standards",
        type: "action",
        actionLabel: "Apply project standards",
        hint: "Overwrite material fields from project standards pack",
      },
    ],
  });
}
