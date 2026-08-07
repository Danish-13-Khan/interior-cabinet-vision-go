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
} from "./cabinetComposition";
import { getFamilyOpeningRules } from "./cabinetFamilyRules";
import {
  collectOpeningLeaves,
  getActiveOpeningLeaf,
  openingStructureToLegacyStyle,
  setActiveOpening,
  setOpeningContentType,
  splitOpening,
  updateOpeningLeaf,
  type OpeningContentType,
} from "./cabinetOpeningStructure";
import {
  ENGINEERED_CABINET_PRESETS,
  getEngineeredCabinetPreset,
  listEngineeredPresetsForFamily,
} from "./cabinetPresets";
import {
  CARCASS_STYLE_OPTIONS,
  CASE_JOINERY_OPTIONS,
  DOOR_MOUNT_OPTIONS,
  DRAWER_BOX_STYLE_OPTIONS,
  FACE_FRAME_RAIL_MAX_MM,
  FACE_FRAME_RAIL_MIN_MM,
  FACE_FRAME_STILE_MAX_MM,
  FACE_FRAME_STILE_MIN_MM,
  SHELF_MOUNT_OPTIONS,
  describeConstructionSpec,
  normalizeConstructionSpec,
  shelfMountFromAdjustable,
  shelvesAreAdjustable,
  type CarcassStyle,
  type CaseJoinery,
  type DoorMount,
  type DrawerBoxStyle,
  type ShelfMount,
} from "./cabinetConstructionSpec";
import { isStorageType } from "./cabinetCapabilities";
import {
  ACCESSORY_CATALOG_IDS,
  APPLIANCE_INSERT_OPTIONS,
  describeHardwareSpec,
  getHardwareItem,
  hardwareItemsOfKind,
  isAccessoryCompatible,
  normalizeCabinetHardware,
  type ApplianceInsertKind,
} from "./hardwareSystem";

export type PropertyFieldType = "number" | "boolean" | "enum" | "readonly" | "action";

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
  actionLabel?: string;
};

export type PropertySectionDef = {
  id: string;
  label: string;
  hint?: string;
  fields: PropertyFieldDef[];
};

export type PropertyFieldValue = string | number | boolean;

const CONTENT_TYPE_LABELS: Record<OpeningContentType, string> = {
  door: "Door Opening",
  "drawer-stack": "Drawer Stack",
  "open-shelf": "Open Shelf Section",
  divider: "Divider Section",
  empty: "Empty",
};

function compositionOf(config: CabinetConfig): CabinetComposition {
  return resolveCabinetComposition(config);
}

function constructionOf(config: CabinetConfig) {
  return normalizeConstructionSpec(config.type, config.construction, {
    shelvesAdjustable: compositionOf(config).shelves.adjustable,
  });
}

function hardwareOf(config: CabinetConfig) {
  return normalizeCabinetHardware(config.type, config.hardware);
}

function patchHardware(
  config: CabinetConfig,
  patch: Partial<ReturnType<typeof hardwareOf>>,
): CabinetConfig {
  const current = hardwareOf(config);
  return clampCabinetConfig({
    ...config,
    hardware: normalizeCabinetHardware(config.type, { ...current, ...patch }),
  });
}

function patchConstruction(
  config: CabinetConfig,
  patch: Partial<ReturnType<typeof constructionOf>>,
): CabinetConfig {
  const current = constructionOf(config);
  const next = normalizeConstructionSpec(config.type, { ...current, ...patch, faceFrame: {
    ...current.faceFrame,
    ...(patch.faceFrame ?? {}),
  }});
  const withConstruction = { ...config, construction: next };
  if (patch.shelfMount !== undefined) {
    return patchComposition(withConstruction, (composition) => ({
      ...composition,
      shelves: {
        ...composition.shelves,
        adjustable: shelvesAreAdjustable(next.shelfMount),
      },
    }));
  }
  return withConstruction;
}

function patchOpeningStructure(
  config: CabinetConfig,
  patch: (composition: CabinetComposition) => CabinetComposition["openingStructure"],
): CabinetConfig {
  return patchComposition(config, (composition) => ({
    ...composition,
    openingStructure: patch(composition) ?? composition.openingStructure,
  }));
}

export function getCabinetEditorValue(
  config: CabinetConfig,
  fieldId: string,
): PropertyFieldValue {
  const composition = compositionOf(config);
  const structure = composition.openingStructure;
  const activeLeaf = structure ? getActiveOpeningLeaf(structure) : null;
  const leaves = structure ? collectOpeningLeaves(structure.root) : [];
  const rules = getFamilyOpeningRules(config.type);

  switch (fieldId) {
    case "family":
      return config.type;
    case "preset":
      return "";
    case "specSummary":
      return describeComposition(composition);
    case "familyRulesNote":
      return rules.notes;
    case "constructionSummary":
      return describeConstructionSpec(constructionOf(config));
    case "carcassStyle":
      return constructionOf(config).carcassStyle;
    case "caseJoinery":
      return constructionOf(config).caseJoinery;
    case "doorMount":
      return constructionOf(config).doorMount;
    case "shelfMount":
      return constructionOf(config).shelfMount;
    case "drawerBoxStyle":
      return constructionOf(config).drawerBoxStyle;
    case "hardwareSummary":
      return describeHardwareSpec(hardwareOf(config));
    case "hingeId":
      return hardwareOf(config).hingeId;
    case "slideId":
      return hardwareOf(config).slideId;
    case "handleId":
      return hardwareOf(config).handleId;
    case "legId":
      return hardwareOf(config).legId;
    case "bracketId":
      return hardwareOf(config).bracketId;
    case "includeShelfPins":
      return hardwareOf(config).includeShelfPins;
    case "insertKind":
      return hardwareOf(config).insertKind;
    case "accessoryPrimary":
      return hardwareOf(config).accessories[0]?.id ?? "";
    case "accessoryPrimaryQty":
      return hardwareOf(config).accessories[0]?.quantity ?? 0;
    case "faceFrameStile":
      return constructionOf(config).faceFrame.stileWidthMm;
    case "faceFrameRail":
      return constructionOf(config).faceFrame.railWidthMm;
    case "width":
      return config.dimensions.width;
    case "height":
      return config.dimensions.height;
    case "depth":
      return config.dimensions.depth;
    case "openingTree":
      return structure
        ? leaves
            .map((leaf) => `${leaf.label} (${CONTENT_TYPE_LABELS[leaf.contentType]})`)
            .join(" · ")
        : "—";
    case "activeOpening":
      return activeLeaf?.id ?? "";
    case "openingContentType":
      return activeLeaf?.contentType ?? "empty";
    case "openingRatio":
      return Math.round((activeLeaf?.ratio ?? 1) * 100);
    case "openingLeafDoorStyle":
      return activeLeaf?.doorStyle ?? "none";
    case "openingLeafDoorHinge":
      return activeLeaf?.doorHinge ?? "left";
    case "openingLeafDrawerCount":
      return activeLeaf?.drawerCount ?? 0;
    case "openingLeafShelfCount":
      return activeLeaf?.shelfCount ?? 0;
    case "openingStyle":
      return structure
        ? openingStructureToLegacyStyle(structure)
        : (composition.openings[0]?.style ?? "open");
    case "openingLabel":
      return activeLeaf?.label ?? composition.openings[0]?.label ?? "—";
    case "splitVertical":
    case "splitHorizontal":
      return false;
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
  const structure = composition.openingStructure;
  const activeLeaf = structure ? getActiveOpeningLeaf(structure) : null;
  const leaves = structure ? collectOpeningLeaves(structure.root) : [];
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

  if (caps.openings && rules.supportsOpenings) {
    const openingFields: PropertyFieldDef[] = [
      {
        id: "openingTree",
        label: "Structure",
        type: "readonly",
      },
      {
        id: "openingStyle",
        label: "Aggregate",
        type: "readonly",
        hint: "Derived from opening leaves",
      },
      {
        id: "activeOpening",
        label: "Active opening",
        type: "enum",
        options: leaves.map((leaf) => ({
          value: leaf.id,
          label: `${leaf.label} · ${CONTENT_TYPE_LABELS[leaf.contentType]}`,
        })),
      },
      {
        id: "openingContentType",
        label: "Content",
        type: "enum",
        options: rules.allowedContentTypes.map((value) => ({
          value,
          label: CONTENT_TYPE_LABELS[value],
        })),
      },
    ];

    if (leaves.length > 1 && activeLeaf) {
      openingFields.push({
        id: "openingRatio",
        label: "Leaf share",
        type: "number",
        unit: "%",
        min: 5,
        max: 95,
        step: 5,
        hint: "Relative share within parent split",
      });
    }

    if (activeLeaf?.contentType === "door") {
      openingFields.push({
        id: "openingLeafDoorStyle",
        label: "Door style",
        type: "enum",
        options: [
          { value: "single", label: "Single" },
          { value: "double", label: "Double" },
          { value: "bi-fold", label: "Bi-fold" },
        ],
      });
      if (activeLeaf.doorStyle === "single") {
        openingFields.push({
          id: "openingLeafDoorHinge",
          label: "Hinge",
          type: "enum",
          options: [
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
          ],
        });
      }
      if (caps.shelves) {
        openingFields.push({
          id: "openingLeafShelfCount",
          label: "Shelves in bay",
          type: "number",
          min: CABINET_SHELF_MIN,
          max: CABINET_SHELF_MAX,
          step: 1,
        });
      }
    }

    if (activeLeaf?.contentType === "drawer-stack") {
      openingFields.push({
        id: "openingLeafDrawerCount",
        label: "Drawers in stack",
        type: "number",
        min: 1,
        max: CABINET_DRAWER_MAX,
        step: 1,
      });
    }

    if (activeLeaf?.contentType === "open-shelf") {
      openingFields.push({
        id: "openingLeafShelfCount",
        label: "Shelves in section",
        type: "number",
        min: CABINET_SHELF_MIN,
        max: CABINET_SHELF_MAX,
        step: 1,
      });
    }

    if (rules.allowVerticalSplit) {
      openingFields.push({
        id: "splitVertical",
        label: "Split",
        type: "action",
        actionLabel: "Vertical",
        hint: "Split active opening side-by-side",
      });
    }
    if (rules.allowHorizontalSplit) {
      openingFields.push({
        id: "splitHorizontal",
        label: rules.allowVerticalSplit ? " " : "Split",
        type: "action",
        actionLabel: "Horizontal",
        hint: "Stack openings top / bottom",
      });
    }

    sections.push({
      id: "openings",
      label: "Openings",
      hint: rules.notes,
      fields: openingFields,
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
          hint: "Synced with shelf mount in Construction",
        },
      ],
    });
  }

  if (isStorageType(config.type)) {
    const construction = constructionOf(config);
    const constructionFields: PropertyFieldDef[] = [
      {
        id: "constructionSummary",
        label: "Summary",
        type: "readonly",
      },
      {
        id: "carcassStyle",
        label: "Carcass",
        type: "enum",
        options: CARCASS_STYLE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      },
      {
        id: "caseJoinery",
        label: "Case joinery",
        type: "enum",
        options: CASE_JOINERY_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
        hint: "Sides / top / bottom assembly",
      },
      {
        id: "shelfMount",
        label: "Shelf mount",
        type: "enum",
        options: SHELF_MOUNT_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      },
    ];

    if (caps.doors) {
      constructionFields.push({
        id: "doorMount",
        label: "Door mount",
        type: "enum",
        options: DOOR_MOUNT_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      });
    }

    if (caps.drawers) {
      constructionFields.push({
        id: "drawerBoxStyle",
        label: "Drawer box",
        type: "enum",
        options: DRAWER_BOX_STYLE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      });
    }

    if (construction.carcassStyle === "face-frame") {
      constructionFields.push(
        {
          id: "faceFrameStile",
          label: "Stile width",
          type: "number",
          unit: "mm",
          min: FACE_FRAME_STILE_MIN_MM,
          max: FACE_FRAME_STILE_MAX_MM,
          step: 1,
        },
        {
          id: "faceFrameRail",
          label: "Rail width",
          type: "number",
          unit: "mm",
          min: FACE_FRAME_RAIL_MIN_MM,
          max: FACE_FRAME_RAIL_MAX_MM,
          step: 1,
        },
      );
    }

    sections.push({
      id: "construction",
      label: "Construction",
      hint: "How the cabinet is built for shop output",
      fields: constructionFields,
    });

    const hardware = hardwareOf(config);
    const accessoryOptions = ACCESSORY_CATALOG_IDS.filter((id) =>
      isAccessoryCompatible(id, config.type, hardware.insertKind),
    ).map((id) => ({
      value: id,
      label: getHardwareItem(id)?.label ?? id,
    }));
    const hardwareFields: PropertyFieldDef[] = [
      {
        id: "hardwareSummary",
        label: "Summary",
        type: "readonly",
      },
      {
        id: "insertKind",
        label: "Appliance insert",
        type: "enum",
        options: APPLIANCE_INSERT_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
        hint: "Sink / cooktop / dishwasher compatibility",
      },
    ];
    if (caps.doors) {
      hardwareFields.push({
        id: "hingeId",
        label: "Hinge",
        type: "enum",
        options: hardwareItemsOfKind("hinge").map((item) => ({
          value: item.id,
          label: `${item.label} (₹${item.costPerUnit})`,
        })),
      });
    }
    if (caps.drawers) {
      hardwareFields.push({
        id: "slideId",
        label: "Drawer slide",
        type: "enum",
        options: hardwareItemsOfKind("slide").map((item) => ({
          value: item.id,
          label: `${item.label} (₹${item.costPerUnit})`,
        })),
      });
    }
    if (caps.doors || caps.drawers) {
      hardwareFields.push({
        id: "handleId",
        label: "Handle",
        type: "enum",
        options: hardwareItemsOfKind("handle").map((item) => ({
          value: item.id,
          label: `${item.label} (₹${item.costPerUnit})`,
        })),
      });
    }
    hardwareFields.push(
      {
        id: "legId",
        label: "Support legs",
        type: "enum",
        options: [
          { value: "none", label: "None" },
          ...hardwareItemsOfKind("leg").map((item) => ({
            value: item.id,
            label: `${item.label} (₹${item.costPerUnit})`,
          })),
        ],
      },
      {
        id: "bracketId",
        label: "Wall brackets",
        type: "enum",
        options: [
          { value: "none", label: "None" },
          ...hardwareItemsOfKind("bracket").map((item) => ({
            value: item.id,
            label: `${item.label} (₹${item.costPerUnit})`,
          })),
        ],
      },
      {
        id: "includeShelfPins",
        label: "Shelf pins",
        type: "boolean",
      },
    );
    if (accessoryOptions.length > 0) {
      hardwareFields.push(
        {
          id: "accessoryPrimary",
          label: "Accessory",
          type: "enum",
          options: [{ value: "", label: "None" }, ...accessoryOptions],
        },
        {
          id: "accessoryPrimaryQty",
          label: "Accessory qty",
          type: "number",
          min: 0,
          max: 4,
          step: 1,
        },
      );
    }
    sections.push({
      id: "hardware",
      label: "Hardware",
      hint: "Hinges, slides, handles, legs, and accessories",
      fields: hardwareFields,
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

  const widthMm = config.dimensions.width;

  switch (fieldId) {
    case "activeOpening":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        return setActiveOpening(composition.openingStructure, String(value));
      });
    case "openingContentType":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return setOpeningContentType(
          composition.openingStructure,
          active.id,
          value as OpeningContentType,
          config.type,
          widthMm,
        );
      });
    case "openingRatio":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { ratio: Number(value) / 100 },
          config.type,
          widthMm,
        );
      });
    case "openingLeafDoorStyle":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { doorStyle: value as DoorStyle },
          config.type,
          widthMm,
        );
      });
    case "openingLeafDoorHinge":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { doorHinge: value as DoorHinge },
          config.type,
          widthMm,
        );
      });
    case "openingLeafDrawerCount":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { drawerCount: Number(value) },
          config.type,
          widthMm,
        );
      });
    case "openingLeafShelfCount":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { shelfCount: Number(value) },
          config.type,
          widthMm,
        );
      });
    case "splitVertical":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return splitOpening(
          composition.openingStructure,
          active.id,
          "vertical",
          config.type,
          widthMm,
        );
      });
    case "splitHorizontal":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return splitOpening(
          composition.openingStructure,
          active.id,
          "horizontal",
          config.type,
          widthMm,
        );
      });
    case "shelfCount":
      return patchComposition(config, (composition) => {
        const next = {
          ...composition,
          shelves: { ...composition.shelves, count: Number(value) },
        };
        if (!composition.openingStructure) return next;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (
          active &&
          (active.contentType === "open-shelf" || active.contentType === "door")
        ) {
          return {
            ...next,
            openingStructure: updateOpeningLeaf(
              composition.openingStructure,
              active.id,
              { shelfCount: Number(value) },
              config.type,
              widthMm,
            ),
          };
        }
        return next;
      });
    case "shelvesAdjustable":
      return patchConstruction(
        patchComposition(config, (composition) => ({
          ...composition,
          shelves: { ...composition.shelves, adjustable: Boolean(value) },
        })),
        { shelfMount: shelfMountFromAdjustable(Boolean(value)) },
      );
    case "carcassStyle":
      return patchConstruction(config, { carcassStyle: String(value) as CarcassStyle });
    case "caseJoinery":
      return patchConstruction(config, { caseJoinery: String(value) as CaseJoinery });
    case "doorMount":
      return patchConstruction(config, { doorMount: String(value) as DoorMount });
    case "shelfMount":
      return patchConstruction(config, { shelfMount: String(value) as ShelfMount });
    case "drawerBoxStyle":
      return patchConstruction(config, { drawerBoxStyle: String(value) as DrawerBoxStyle });
    case "faceFrameStile":
      return patchConstruction(config, {
        faceFrame: {
          ...constructionOf(config).faceFrame,
          stileWidthMm: Number(value),
        },
      });
    case "faceFrameRail":
      return patchConstruction(config, {
        faceFrame: {
          ...constructionOf(config).faceFrame,
          railWidthMm: Number(value),
        },
      });
    case "hingeId":
      return patchHardware(config, { hingeId: String(value) });
    case "slideId":
      return patchHardware(config, { slideId: String(value) });
    case "handleId":
      return patchHardware(config, { handleId: String(value) });
    case "legId":
      return patchHardware(config, { legId: String(value) });
    case "bracketId":
      return patchHardware(config, { bracketId: String(value) });
    case "includeShelfPins":
      return patchHardware(config, { includeShelfPins: Boolean(value) });
    case "insertKind":
      return patchHardware(config, {
        insertKind: String(value) as ApplianceInsertKind,
        accessories: hardwareOf(config).accessories.filter((line) =>
          isAccessoryCompatible(line.id, config.type, String(value) as ApplianceInsertKind),
        ),
      });
    case "accessoryPrimary": {
      const id = String(value);
      const qty = Math.max(1, hardwareOf(config).accessories[0]?.quantity ?? 1);
      return patchHardware(config, {
        accessories: id
          ? [{ id, quantity: qty }]
          : [],
      });
    }
    case "accessoryPrimaryQty": {
      const qty = Number(value);
      const current = hardwareOf(config).accessories[0];
      if (!current) return config;
      return patchHardware(config, {
        accessories: qty > 0 ? [{ id: current.id, quantity: qty }] : [],
      });
    }
    case "dividerCount":
      return patchComposition(config, (composition) => ({
        ...composition,
        dividers: { ...composition.dividers, count: Number(value) },
      }));
    case "doorsEnabled": {
      const enabled = Boolean(value);
      return patchComposition(config, (composition) => {
        let openingStructure = composition.openingStructure;
        if (openingStructure) {
          const active = getActiveOpeningLeaf(openingStructure);
          if (active) {
            const allowed = getFamilyOpeningRules(config.type).allowedContentTypes;
            const nextType = enabled
              ? "door"
              : allowed.includes("open-shelf")
                ? "open-shelf"
                : (allowed[0] ?? "empty");
            if (allowed.includes(nextType)) {
              openingStructure = setOpeningContentType(
                openingStructure,
                active.id,
                nextType,
                config.type,
                widthMm,
              );
            }
          }
        }
        return {
          ...composition,
          openingStructure,
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
        };
      });
    }
    case "doorStyle":
      return patchComposition(config, (composition) => {
        let openingStructure = composition.openingStructure;
        if (openingStructure) {
          const active = getActiveOpeningLeaf(openingStructure);
          if (active?.contentType === "door") {
            openingStructure = updateOpeningLeaf(
              openingStructure,
              active.id,
              { doorStyle: value as DoorStyle },
              config.type,
              widthMm,
            );
          } else if (value !== "none" && active) {
            openingStructure = setOpeningContentType(
              openingStructure,
              active.id,
              "door",
              config.type,
              widthMm,
            );
            openingStructure = updateOpeningLeaf(
              openingStructure,
              active.id,
              { doorStyle: value as DoorStyle },
              config.type,
              widthMm,
            );
          }
        }
        return {
          ...composition,
          openingStructure,
          doors: {
            ...composition.doors,
            style: value as DoorStyle,
            enabled: value !== "none",
          },
        };
      });
    case "doorHinge":
      return patchComposition(config, (composition) => {
        let openingStructure = composition.openingStructure;
        if (openingStructure) {
          const active = getActiveOpeningLeaf(openingStructure);
          if (active?.contentType === "door") {
            openingStructure = updateOpeningLeaf(
              openingStructure,
              active.id,
              { doorHinge: value as DoorHinge },
              config.type,
              widthMm,
            );
          }
        }
        return {
          ...composition,
          openingStructure,
          doors: { ...composition.doors, hinge: value as DoorHinge },
        };
      });
    case "drawerCount":
      return patchComposition(config, (composition) => {
        let openingStructure = composition.openingStructure;
        if (openingStructure) {
          const active = getActiveOpeningLeaf(openingStructure);
          if (active?.contentType === "drawer-stack") {
            openingStructure = updateOpeningLeaf(
              openingStructure,
              active.id,
              { drawerCount: Number(value) },
              config.type,
              widthMm,
            );
          } else if (
            Number(value) > 0 &&
            active &&
            collectOpeningLeaves(openingStructure.root).length === 1 &&
            getFamilyOpeningRules(config.type).allowedContentTypes.includes("drawer-stack")
          ) {
            openingStructure = setOpeningContentType(
              openingStructure,
              active.id,
              "drawer-stack",
              config.type,
              widthMm,
            );
            openingStructure = updateOpeningLeaf(
              openingStructure,
              active.id,
              { drawerCount: Number(value) },
              config.type,
              widthMm,
            );
          }
        }
        return {
          ...composition,
          openingStructure,
          drawers: { ...composition.drawers, count: Number(value) },
        };
      });
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
          heightMm: Boolean(value) ? composition.toeKick.heightMm || 100 : 0,
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
