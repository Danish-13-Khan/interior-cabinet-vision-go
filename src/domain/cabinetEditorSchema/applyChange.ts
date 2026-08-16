import type { CabinetConfig, CabinetType } from "../cabinetDimensions";
import {
  clampCabinetConfig,
  getDefaultCabinetConfig,
} from "../cabinetDimensions";
import type { DoorHinge, DoorStyle } from "../cabinetComposition";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import {
  collectOpeningLeaves,
  getActiveOpeningLeaf,
  setOpeningContentType,
  updateOpeningLeaf,
} from "../cabinetOpeningStructure";
import { getEngineeredCabinetPreset } from "../cabinetPresets";
import {
  shelfMountFromAdjustable,
  type CarcassStyle,
  type CaseJoinery,
  type DoorMount,
  type DrawerBoxStyle,
  type ShelfMount,
} from "../cabinetConstructionSpec";
import {
  isAccessoryCompatible,
  type ApplianceInsertKind,
} from "../hardwareSystem";
import type { PropertyFieldValue } from "./types";
import {
  constructionOf,
  hardwareOf,
  patchComposition,
  patchConstruction,
  patchHardware,
} from "./helpers";
import { tryApplyOpeningEditorChange } from "./applyOpenings";
import { tryApplyMaterialsEditorChange } from "./applyMaterials";
import type { ProjectStandards } from "../projectStandards";

export function applyCabinetEditorChange(
  config: CabinetConfig,
  fieldId: string,
  value: PropertyFieldValue,
  standards?: ProjectStandards | null,
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

  const materialsResult = tryApplyMaterialsEditorChange(
    config,
    fieldId,
    value,
    standards,
  );
  if (materialsResult) return clampCabinetConfig(materialsResult);

  const widthMm = config.dimensions.width;
  const openingResult = tryApplyOpeningEditorChange(config, fieldId, value, widthMm);
  if (openingResult) return openingResult;

  switch (fieldId) {
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
    case "applianceWidthMm":
    case "applianceHeightMm":
    case "applianceDepthMm":
      return patchHardware(config, { [fieldId]: Number(value) });
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
