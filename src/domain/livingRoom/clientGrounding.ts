import type { CabinetRunAudience } from "./cabinetRunFrame";

export type ContactShadowLook = { opacity: number; blur: number };

/** Client framing sits low and wide; off-white floor and walls need a firmer contact shadow to read as grounded. */
export const CLIENT_CONTACT_SHADOW_OPACITY_SCALE = 1.7;
export const CLIENT_CONTACT_SHADOW_BLUR_SCALE = 0.65;
export const CLIENT_CONTACT_SHADOW_MAX_OPACITY = 0.72;

export function resolveContactShadowLook(
  base: ContactShadowLook,
  audience: CabinetRunAudience | undefined,
): ContactShadowLook {
  if (audience !== "client") return base;
  return {
    opacity: Math.min(CLIENT_CONTACT_SHADOW_MAX_OPACITY, base.opacity * CLIENT_CONTACT_SHADOW_OPACITY_SCALE),
    blur: base.blur * CLIENT_CONTACT_SHADOW_BLUR_SCALE,
  };
}
