import type { CabinetConfig } from "../cabinetDimensions";
import {
  CABINET_DRAWER_MAX,
  CABINET_SHELF_MAX,
  CABINET_SHELF_MIN,
} from "../cabinetDimensions";
import { getCompositionCapabilities } from "../cabinetComposition";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import {
  collectOpeningLeaves,
  getActiveOpeningLeaf,
} from "../cabinetOpeningStructure";
import type { PropertyFieldDef, PropertySectionDef } from "./types";
import { CONTENT_TYPE_LABELS, compositionOf } from "./helpers";

export function appendOpeningsSection(
  sections: PropertySectionDef[],
  config: CabinetConfig,
): void {
  const caps = getCompositionCapabilities(config.type);
  const composition = compositionOf(config);
  const structure = composition.openingStructure;
  const activeLeaf = structure ? getActiveOpeningLeaf(structure) : null;
  const leaves = structure ? collectOpeningLeaves(structure.root) : [];
  const rules = getFamilyOpeningRules(config.type);

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

}
