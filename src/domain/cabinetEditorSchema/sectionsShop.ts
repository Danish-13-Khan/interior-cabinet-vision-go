import type { CabinetConfig } from "../cabinetDimensions";
import { getCompositionCapabilities } from "../cabinetComposition";
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
} from "../cabinetConstructionSpec";
import { isStorageType } from "../cabinetCapabilities";
import {
  ACCESSORY_CATALOG_IDS,
  APPLIANCE_INSERT_OPTIONS,
  getHardwareItem,
  hardwareItemsOfKind,
  isAccessoryCompatible,
} from "../hardwareSystem";
import type { PropertyFieldDef, PropertySectionDef } from "./types";
import { constructionOf, hardwareOf } from "./helpers";

export function appendConstructionHardwareSections(
  sections: PropertySectionDef[],
  config: CabinetConfig,
): void {
  const caps = getCompositionCapabilities(config.type);

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

}
