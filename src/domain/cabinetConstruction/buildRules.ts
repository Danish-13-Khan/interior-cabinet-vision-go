import type { CabinetConfig } from "../cabinetDimensions";
import { DEFAULT_BUILD_RULES, type CabinetBuildRules } from "../materialSystem";

/** Build rules for a cabinet: production and the legacy cut list both take board thicknesses from here. */
export function resolveCabinetBuildRules(config: CabinetConfig): CabinetBuildRules {
  return { ...DEFAULT_BUILD_RULES, ...(config.buildRules ?? {}) };
}
