import { getDefaultCabinetConfig, type CabinetConfig } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { buildHardwareLines } from "../hardwareSystem";
import { applyFrontSystemParameters } from "./frontSystemParameters";
import { slidingParametersPatch, type SlidingOverrides } from "./slidingSpec";

/** Test-only: a wardrobe of `widthMm` with sliding shutters chosen through object parameters. */
export function slidingWardrobe(
  widthMm: number,
  overrides: SlidingOverrides = {},
  extra: Record<string, string | number | boolean> = {},
): CabinetConfig {
  const base = getDefaultCabinetConfig("almirah");
  const config: CabinetConfig = {
    ...base,
    dimensions: { ...base.dimensions, width: widthMm, height: 2400, depth: 600 },
    buildRules: { ...base.buildRules, finishId: "grey" },
  };
  return applyFrontSystemParameters(config, { ...extra, ...slidingParametersPatch(overrides) });
}

/** Test-only: the hardware lines a cabinet schedules (cut list / quote / schedule source). */
export function hardwareFor(config: CabinetConfig) {
  const cabinet = {
    id: "w",
    name: "Wardrobe",
    config,
    placement: { x: 0, y: 0, z: 0, rotation: 0 as const, attachment: "floor" as const },
  };
  return buildHardwareLines(cabinet, createCabinetConstruction(config), DEFAULT_COSTING_SETTINGS);
}
