import type { LightEntity, ParameterValue } from "../interiorProject";

/** Every mount key. `detachLight` deletes these and bakes the resolved pose. */
export const LIGHT_MOUNT_PARAMETER_KEYS = [
  "hostObjectId",
  "offsetXmm",
  "offsetYmm",
  "offsetZmm",
  "fitHostWidth",
  "hostWallId",
  "alongMm",
  "centerHeightMm",
  "wallSide",
  "hostSurface",
  "ceilingDropMm",
  "hostCutoutId",
  "attachmentMissing",
] as const;

export function stripLightMountParameters(
  parameters: Record<string, ParameterValue>,
): Record<string, ParameterValue> {
  const next = { ...parameters };
  for (const key of LIGHT_MOUNT_PARAMETER_KEYS) delete next[key];
  return next;
}

/** Read-time flag: the host is gone, so the fixture contributes no light. */
export function markLightAttachmentMissing(light: LightEntity): LightEntity {
  return {
    ...light,
    enabled: false,
    parameters: { ...light.parameters, attachmentMissing: true },
  };
}
