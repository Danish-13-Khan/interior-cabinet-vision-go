import type { CabinetConfig } from "../cabinetDimensions";
import type { ParameterValue } from "../interiorProject";
import { APPLIANCE_DEPTH_MM, APPLIANCE_WIDTH_MM, INSERT_KIND } from "../hostedAppliances/parameters";
import { APPLIANCE_INSERT_OPTIONS } from "./catalog";
import { normalizeCabinetHardware } from "./normalize";
import type { ApplianceInsertKind, CabinetHardwareSpec } from "./types";

/** The cabinet object's `insertKind` (written by a hosted sink / hob) overrides the stored hardware spec. */
export function applyInsertParameters(config: CabinetConfig, parameters: Record<string, ParameterValue>): CabinetConfig {
  const insertKind = parameters[INSERT_KIND];
  if (!APPLIANCE_INSERT_OPTIONS.some((option) => option.value === insertKind)) return config;
  return {
    ...config,
    hardware: normalizeCabinetHardware(config.type, {
      ...config.hardware,
      insertKind: insertKind as ApplianceInsertKind,
      applianceWidthMm: Number(parameters[APPLIANCE_WIDTH_MM] ?? config.hardware?.applianceWidthMm ?? 0),
      applianceDepthMm: Number(parameters[APPLIANCE_DEPTH_MM] ?? config.hardware?.applianceDepthMm ?? 0),
    }),
  };
}

const CUTOUT_LABELS: Partial<Record<ApplianceInsertKind, string>> = { "sink-bowl": "sink", cooktop: "hob" };

/** Worktop cut-out for the report; the worktop and cut list stay rectangular. */
export function worktopCutoutNote(hardware: CabinetHardwareSpec): string | null {
  const label = CUTOUT_LABELS[hardware.insertKind];
  if (!label) return null;
  const size = hardware.applianceWidthMm > 0 && hardware.applianceDepthMm > 0
    ? `${hardware.applianceWidthMm} × ${hardware.applianceDepthMm} mm`
    : "size from the appliance template";
  return `Worktop cut-out for the ${label}: ${size} (cut on site to the appliance template; not on the cut list).`;
}
