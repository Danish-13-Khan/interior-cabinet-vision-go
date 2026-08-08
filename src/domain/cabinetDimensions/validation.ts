import {
  evaluateCabinetRules,
  formatManufacturingIssues,
} from "../manufacturingRules";
import type { CabinetConfig, CabinetPlacement } from "./types";
import { clampCabinetConfig } from "./clamps";

export function getCabinetValidationMessages(
  config: CabinetConfig,
  placement?: CabinetPlacement | null,
  roomHeightMm?: number,
): string[] {
  const safeConfig = clampCabinetConfig(config);
  return formatManufacturingIssues(
    evaluateCabinetRules(safeConfig, {
      placement: placement ?? null,
      roomHeightMm,
    }),
  );
}
