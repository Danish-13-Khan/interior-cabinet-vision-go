import type { CabinetConfig, CabinetType } from "./cabinetDimensions";
import {
  CABINET_DEPTH_MAX_MM,
  CABINET_DEPTH_MIN_MM,
  CABINET_DEPTH_STEP_MM,
  CABINET_DRAWER_MAX,
  CABINET_DRAWER_MIN,
  CABINET_HEIGHT_MAX_MM,
  CABINET_HEIGHT_MIN_MM,
  CABINET_HEIGHT_STEP_MM,
  CABINET_SHELF_MAX,
  CABINET_SHELF_MIN,
  CABINET_TOE_KICK_HEIGHT_MAX_MM,
  CABINET_TOE_KICK_HEIGHT_MIN_MM,
  CABINET_TOE_KICK_INSET_MAX_MM,
  CABINET_TOE_KICK_INSET_MIN_MM,
  CABINET_WIDTH_MAX_MM,
  CABINET_WIDTH_MIN_MM,
  CABINET_WIDTH_STEP_MM,
  cabinetTypeLabels,
  clampCabinetConfig,
  getDefaultCabinetConfig,
} from "./cabinetDimensions";
import {
  describeComposition,
  getCompositionCapabilities,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
  type CabinetComposition,
  type DoorHinge,
  type DoorStyle,
  type OpeningStyle,
} from "./cabinetComposition";
import {
  ENGINEERED_CABINET_PRESETS,
  getEngineeredCabinetPreset,
  listEngineeredPresetsForFamily,
} from "./cabinetPresets";

export type PropertyFieldType = "number" | "boolean" | "enum" | "readonly";

export type PropertyFieldOption = {
  value: string;
  label: string;
};

export type PropertyFieldDef = {
  id: string;
  label: string;
  type: PropertyFieldType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: PropertyFieldOption[];
  hint?: string;
};

export type PropertySectionDef = {
  id: string;
  label: string;
  hint?: string;
  fields: PropertyFieldDef[];
};

export type PropertyFieldValue = string | number | boolean;

function compositionOf(config: CabinetConfig): CabinetComposition {
  return resolveCabinetComposition(config);
}

export function getCabinetEditorValue(
  config: CabinetConfig,
  fieldId: string,
): PropertyFieldValue {
  const composition = compositionOf(config);

  switch (fieldId) {
    case "family":
      return config.type;
    case "preset":
      return "";
    case "specSummary":
      return describeComposition(composition);
    case "width":
      return config.dimensions.width;
    case "height":
      return config.dimensions.height;
    case "depth":
      return config.dimensions.depth;
    case "openingLabel":
      return composition.openings[0]?.label ?? "—";
    case "openingStyle":
      return composition.openings[0]?.style ?? "open";
    case "shelfCount":
      return composition.shelves.count;
    case "shelvesAdjustable":
      return composition.shelves.adjustable;
    case "dividerCount":
      return composition.dividers.count;
    case "doorsEnabled":
      return composition.doors.enabled;
    case "doorStyle":
      return composition.doors.style;
    case "doorHinge":
      return composition.doors.hinge;
    case "doorCount":
      return composition.doors.count;
    case "drawerCount":
      return composition.drawers.count;
    case "drawersEqualHeights":
      return composition.drawers.equalHeights;
    case "toeKickEnabled":
      return composition.toeKick.enabled;
    case "toeKickHeight":
      return composition.toeKick.heightMm;
    case "toeKickInset":
      return composition.toeKick.insetMm;
    case "fillerLeft":
      return composition.fillers.leftMm;
    case "fillerRight":
      return composition.fillers.rightMm;
    case "endPanelLeft":
      return composition.endPanels.left;
    case "endPanelRight":
      return composition.endPanels.right;
    default:
      return "";
  }
}

export function getCabinetEditorSections(config: CabinetConfig): PropertySectionDef[] {
  const caps = getCompositionCapabilities(config.type);
  const composition = compositionOf(config);
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

  if (caps.openings) {
    sections.push({
      id: "openings",
      label: "Openings",
      fields: [
        {
          id: "openingLabel",
          label: "Bay",
          type: "readonly",
        },
        {
          id: "openingStyle",
          label: "Style",
          type: "enum",
          options: [
            { value: "door", label: "Door bay" },
            { value: "drawer", label: "Drawer bay" },
            { value: "open", label: "Open bay" },
            { value: "mixed", label: "Mixed" },
          ],
        },
      ],
    });
  }

  if (caps.shelves) {
    sections.push({
      id: "shelves",
      label: "Shelves",
      fields: [
        {
          id: "shelfCount",
          label: "Count",
          type: "number",
          min: CABINET_SHELF_MIN,
          max: CABINET_SHELF_MAX,
          step: 1,
        },
        {
          id: "shelvesAdjustable",
          label: "Adjustable",
          type: "boolean",
        },
      ],
    });
  }

  if (caps.dividers) {
    sections.push({
      id: "dividers",
      label: "Dividers",
      fields: [
        {
          id: "dividerCount",
          label: "Vertical",
          type: "number",
          min: 0,
          max: 3,
          step: 1,
          hint: config.type === "corner" ? "Corner return divider included" : undefined,
        },
      ],
    });
  }

  if (caps.doors) {
    const doorFields: PropertyFieldDef[] = [
      {
        id: "doorsEnabled",
        label: "Enabled",
        type: "boolean",
      },
      {
        id: "doorStyle",
        label: "Style",
        type: "enum",
        options: [
          { value: "none", label: "None" },
          { value: "single", label: "Single" },
          { value: "double", label: "Double" },
          { value: "bi-fold", label: "Bi-fold" },
        ],
      },
      {
        id: "doorCount",
        label: "Qty",
        type: "readonly",
        hint: "Derived from style and width",
      },
    ];

    if (composition.doors.style === "single") {
      doorFields.splice(2, 0, {
        id: "doorHinge",
        label: "Hinge",
        type: "enum",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      });
    }

    sections.push({
      id: "doors",
      label: "Doors",
      fields: doorFields,
    });
  }

  if (caps.drawers) {
    sections.push({
      id: "drawers",
      label: "Drawers",
      fields: [
        {
          id: "drawerCount",
          label: "Count",
          type: "number",
          min: CABINET_DRAWER_MIN,
          max: CABINET_DRAWER_MAX,
          step: 1,
        },
        {
          id: "drawersEqualHeights",
          label: "Equal heights",
          type: "boolean",
        },
      ],
    });
  }

  if (caps.toeKick) {
    sections.push({
      id: "toeKick",
      label: "Toe Kick",
      fields: [
        {
          id: "toeKickEnabled",
          label: "Enabled",
          type: "boolean",
        },
        {
          id: "toeKickHeight",
          label: "Height",
          type: "number",
          unit: "mm",
          min: CABINET_TOE_KICK_HEIGHT_MIN_MM,
          max: CABINET_TOE_KICK_HEIGHT_MAX_MM,
          step: 10,
        },
        {
          id: "toeKickInset",
          label: "Inset",
          type: "number",
          unit: "mm",
          min: CABINET_TOE_KICK_INSET_MIN_MM,
          max: CABINET_TOE_KICK_INSET_MAX_MM,
          step: 10,
        },
      ],
    });
  }

  if (caps.fillers) {
    sections.push({
      id: "fillers",
      label: "Fillers",
      fields: [
        {
          id: "fillerLeft",
          label: "Left",
          type: "number",
          unit: "mm",
          min: 0,
          max: 150,
          step: 5,
        },
        {
          id: "fillerRight",
          label: "Right",
          type: "number",
          unit: "mm",
          min: 0,
          max: 150,
          step: 5,
        },
      ],
    });
  }

  if (caps.endPanels) {
    sections.push({
      id: "endPanels",
      label: "End Panels",
      fields: [
        {
          id: "endPanelLeft",
          label: "Left finished",
          type: "boolean",
        },
        {
          id: "endPanelRight",
          label: "Right finished",
          type: "boolean",
        },
      ],
    });
  }

  return sections;
}

function patchComposition(
  config: CabinetConfig,
  patch: (composition: CabinetComposition) => CabinetComposition,
): CabinetConfig {
  const nextComposition = patch(compositionOf(config));
  return clampCabinetConfig({
    ...config,
    composition: nextComposition,
    ...syncFlatFieldsFromComposition(nextComposition),
  });
}

export function applyCabinetEditorChange(
  config: CabinetConfig,
  fieldId: string,
  value: PropertyFieldValue,
): CabinetConfig {
  if (fieldId === "family") {
    return getDefaultCabinetConfig(value as CabinetType);
  }

  if (fieldId === "preset") {
    const presetId = String(value);
    if (!presetId) return config;
    const preset = getEngineeredCabinetPreset(presetId);
    return preset ? clampCabinetConfig(preset.config) : config;
  }

  if (fieldId === "width" || fieldId === "height" || fieldId === "depth") {
    const numeric = Number(value);
    return clampCabinetConfig({
      ...config,
      dimensions: {
        ...config.dimensions,
        [fieldId]: numeric,
      },
    });
  }

  switch (fieldId) {
    case "openingStyle":
      return patchComposition(config, (composition) => ({
        ...composition,
        openings: composition.openings.map((opening, index) =>
          index === 0
            ? { ...opening, style: value as OpeningStyle }
            : opening,
        ),
        doors: {
          ...composition.doors,
          enabled: value === "door" || value === "mixed",
          style:
            value === "door" || value === "mixed"
              ? composition.doors.style === "none"
                ? config.dimensions.width < 600
                  ? "single"
                  : "double"
                : composition.doors.style
              : "none",
        },
        drawers: {
          ...composition.drawers,
          count:
            value === "drawer" || value === "mixed"
              ? Math.max(1, composition.drawers.count)
              : value === "open"
                ? 0
                : composition.drawers.count,
        },
      }));
    case "shelfCount":
      return patchComposition(config, (composition) => ({
        ...composition,
        shelves: { ...composition.shelves, count: Number(value) },
      }));
    case "shelvesAdjustable":
      return patchComposition(config, (composition) => ({
        ...composition,
        shelves: { ...composition.shelves, adjustable: Boolean(value) },
      }));
    case "dividerCount":
      return patchComposition(config, (composition) => ({
        ...composition,
        dividers: { ...composition.dividers, count: Number(value) },
      }));
    case "doorsEnabled": {
      const enabled = Boolean(value);
      return patchComposition(config, (composition) => ({
        ...composition,
        doors: {
          ...composition.doors,
          enabled,
          style: enabled
            ? composition.doors.style === "none"
              ? config.dimensions.width < 600
                ? "single"
                : "double"
              : composition.doors.style
            : "none",
        },
      }));
    }
    case "doorStyle":
      return patchComposition(config, (composition) => ({
        ...composition,
        doors: {
          ...composition.doors,
          style: value as DoorStyle,
          enabled: value !== "none",
        },
      }));
    case "doorHinge":
      return patchComposition(config, (composition) => ({
        ...composition,
        doors: { ...composition.doors, hinge: value as DoorHinge },
      }));
    case "drawerCount":
      return patchComposition(config, (composition) => ({
        ...composition,
        drawers: { ...composition.drawers, count: Number(value) },
      }));
    case "drawersEqualHeights":
      return patchComposition(config, (composition) => ({
        ...composition,
        drawers: { ...composition.drawers, equalHeights: Boolean(value) },
      }));
    case "toeKickEnabled":
      return patchComposition(config, (composition) => ({
        ...composition,
        toeKick: {
          ...composition.toeKick,
          enabled: Boolean(value),
          heightMm: Boolean(value)
            ? composition.toeKick.heightMm || 100
            : 0,
          insetMm: Boolean(value) ? composition.toeKick.insetMm || 60 : 0,
        },
      }));
    case "toeKickHeight":
      return patchComposition(config, (composition) => ({
        ...composition,
        toeKick: {
          ...composition.toeKick,
          enabled: true,
          heightMm: Number(value),
        },
      }));
    case "toeKickInset":
      return patchComposition(config, (composition) => ({
        ...composition,
        toeKick: {
          ...composition.toeKick,
          enabled: true,
          insetMm: Number(value),
        },
      }));
    case "fillerLeft":
      return patchComposition(config, (composition) => ({
        ...composition,
        fillers: { ...composition.fillers, leftMm: Number(value) },
      }));
    case "fillerRight":
      return patchComposition(config, (composition) => ({
        ...composition,
        fillers: { ...composition.fillers, rightMm: Number(value) },
      }));
    case "endPanelLeft":
      return patchComposition(config, (composition) => ({
        ...composition,
        endPanels: { ...composition.endPanels, left: Boolean(value) },
      }));
    case "endPanelRight":
      return patchComposition(config, (composition) => ({
        ...composition,
        endPanels: { ...composition.endPanels, right: Boolean(value) },
      }));
    default:
      return config;
  }
}

export function listAllEngineeredPresets() {
  return ENGINEERED_CABINET_PRESETS;
}
