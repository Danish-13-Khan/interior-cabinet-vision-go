import type { CabinetProject } from "../cabinetDimensions";
import {
  createProductionPacketPayload,
  stablePacketValue,
} from "./packetFingerprintPayload";

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Stable packet fingerprint frozen onto a production release. */
export function createProductionPacketFingerprint(project: CabinetProject): string {
  return `prd-pkt-v2-${hashString(stablePacketValue(createProductionPacketPayload(project)))}`;
}
