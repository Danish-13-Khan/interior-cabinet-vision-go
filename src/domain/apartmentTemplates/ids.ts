import type { LivingRoomIdFactory } from "../livingRoom/ids";

/** Deterministic ids: `apt-2bhk:room:kitchen` (D3). */
export function apartmentIdFactory(templateId: string): LivingRoomIdFactory {
  const prefix = templateId
    .replace(/^template:apartment:/, "apt-")
    .replace(/:v\d+$/, "")
    .replace(/[^a-z0-9-]+/gi, "-")
    .toLowerCase();
  return (scope, key) => `${prefix}:${scope}:${key}`;
}
