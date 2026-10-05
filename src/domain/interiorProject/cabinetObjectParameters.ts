import type { CabinetConfig } from "../cabinetDimensions";
import { applyFrontSystemParameters } from "../frontSystem/frontSystemParameters";
import { applyInsertParameters } from "../hardwareSystem/insertParameters";
import type { ParameterValue } from "./types";

/** Settings stored on the cabinet object's parameters, which survive the per-commit config rebuild. */
export function applyCabinetObjectParameters(config: CabinetConfig, parameters: Record<string, ParameterValue>): CabinetConfig {
  return applyInsertParameters(applyFrontSystemParameters(config, parameters), parameters);
}
