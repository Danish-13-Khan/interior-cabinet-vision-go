import type { CabinetConfig } from "../cabinetDimensions";
import { describeComposition } from "../cabinetComposition";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import {
  collectOpeningLeaves,
  getActiveOpeningLeaf,
  openingStructureToLegacyStyle,
} from "../cabinetOpeningStructure";
import { describeConstructionSpec } from "../cabinetConstructionSpec";
import { describeHardwareSpec } from "../hardwareSystem";
import type { PropertyFieldValue } from "./types";
import {
  CONTENT_TYPE_LABELS,
  compositionOf,
  constructionOf,
  hardwareOf,
} from "./helpers";

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
