import type { CabinetConfig } from "../cabinetDimensions";
import {
  CABINET_DRAWER_MAX,
  CABINET_DRAWER_MIN,
  CABINET_SHELF_MAX,
  CABINET_SHELF_MIN,
  CABINET_TOE_KICK_HEIGHT_MAX_MM,
  CABINET_TOE_KICK_HEIGHT_MIN_MM,
  CABINET_TOE_KICK_INSET_MAX_MM,
  CABINET_TOE_KICK_INSET_MIN_MM,
} from "../cabinetDimensions";
import { getCompositionCapabilities } from "../cabinetComposition";
import type { PropertyFieldDef, PropertySectionDef } from "./types";
import { compositionOf } from "./helpers";

export function appendCompositionSections(
  sections: PropertySectionDef[],
  config: CabinetConfig,
): void {
  const caps = getCompositionCapabilities(config.type);
  const composition = compositionOf(config);

  if (caps.shelves) {
    sections.push({
      id: "shelves",
      group: "construction",
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
  if (caps.dividers) {
    sections.push({
      id: "dividers",
      group: "construction",
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

  // Prefer Openings as source of truth when the family supports structured openings.
  const preferOpenings = caps.openings && Boolean(composition.openingStructure);

  if (caps.doors && !preferOpenings) {
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
      group: "construction",
      label: "Doors",
      fields: doorFields,
    });
  }

  if (caps.drawers && !preferOpenings) {
    sections.push({
      id: "drawers",
      group: "construction",
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
      group: "construction",
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
      group: "construction",
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
      group: "construction",
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


}
