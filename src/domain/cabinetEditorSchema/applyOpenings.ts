import type { CabinetConfig } from "../cabinetDimensions";
import type { DoorHinge, DoorStyle } from "../cabinetComposition";
import {
  createDefaultOpeningStructure,
  deleteOpening,
  getActiveOpeningLeaf,
  mergeOpening,
  setActiveOpening,
  setOpeningContentType,
  setOpeningRatio,
  splitOpening,
  updateOpeningLeaf,
  type OpeningContentType,
} from "../cabinetOpeningStructure";
import type { PropertyFieldValue } from "./types";
import { patchOpeningStructure } from "./helpers";

/** Returns next config if fieldId is an opening editor action; otherwise null. */
export function tryApplyOpeningEditorChange(
  config: CabinetConfig,
  fieldId: string,
  value: PropertyFieldValue,
  widthMm: number,
): CabinetConfig | null {
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
        return setOpeningRatio(
          composition.openingStructure,
          active.id,
          Number(value) / 100,
          config.type,
          widthMm,
        );
      });
    case "openingLabel":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { label: String(value) },
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
    case "openingLeafShelvesAdjustable":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return updateOpeningLeaf(
          composition.openingStructure,
          active.id,
          { shelvesAdjustable: Boolean(value) },
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
    case "mergeOpening":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return mergeOpening(
          composition.openingStructure,
          active.id,
          config.type,
          widthMm,
        );
      });
    case "deleteOpening":
      return patchOpeningStructure(config, (composition) => {
        if (!composition.openingStructure) return composition.openingStructure;
        const active = getActiveOpeningLeaf(composition.openingStructure);
        if (!active) return composition.openingStructure;
        return deleteOpening(
          composition.openingStructure,
          active.id,
          config.type,
          widthMm,
        );
      });
    case "resetAssembly":
      return patchOpeningStructure(config, () =>
        createDefaultOpeningStructure(config.type, widthMm),
      );
    default:
      return null;
  }
}
