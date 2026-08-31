import type { GateOverride } from "./types";

const MAX_REASON = 280;

export function clampGateOverride(
  value: Partial<GateOverride> | null | undefined,
): GateOverride | undefined {
  if (!value) return undefined;
  const reason = String(value.reason ?? "").trim().slice(0, MAX_REASON);
  if (!reason) return undefined;
  const user = String(value.user ?? "").trim().slice(0, 80);
  return {
    reason,
    overriddenAt:
      typeof value.overriddenAt === "string" && value.overriddenAt
        ? value.overriddenAt
        : new Date().toISOString(),
    ...(user ? { user } : {}),
  };
}

export function overrideReasonOk(
  value: Partial<GateOverride> | string | null | undefined,
): boolean {
  if (typeof value === "string") return Boolean(value.trim());
  return Boolean(clampGateOverride(value));
}

export function gateOverrideFromReason(
  reason: string,
  user = "",
  now = new Date().toISOString(),
): GateOverride | undefined {
  return clampGateOverride({ reason, user, overriddenAt: now });
}
