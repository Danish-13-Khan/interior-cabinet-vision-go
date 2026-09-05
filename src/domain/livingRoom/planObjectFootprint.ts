import type { InteriorObjectEntity } from "../interiorProject";
import { readCabinetIdentity } from "../cabinetIdentity";
import { isCabinetRunFiller } from "./wardrobePlacement";

export type PlanFootprintKind = "base" | "wall" | "tall" | "appliance" | "filler" | null;

const APPLIANCE_ID_TOKENS = [
  "fridge",
  "stove",
  "hood",
  "microwave",
  "dishwasher",
  "oven",
  "toaster",
  "blender",
  "coffee",
  "kitchen-sink",
] as const;

const PRESENTATION_PROP_TOKENS = ["kitchen-cabinet", "kitchen-bar"] as const;

function catalogIdLower(object: InteriorObjectEntity): string {
  return (object.catalogItemId ?? "").toLowerCase();
}

function catalogIdMatchesToken(id: string, token: string): boolean {
  return id.includes(token.toLowerCase());
}

/** True for sink cabinets and Kenney/kitchen appliance catalog objects (not presentation props). */
export function isKitchenAppliancePlanObject(object: InteriorObjectEntity): boolean {
  const identity = readCabinetIdentity(object);
  if (identity?.cabinetType === "sink") return true;

  const id = catalogIdLower(object);
  if (APPLIANCE_ID_TOKENS.some((token) => catalogIdMatchesToken(id, token))) {
    return true;
  }

  if (object.category === "kitchen-and-appliances") {
    if (PRESENTATION_PROP_TOKENS.some((token) => catalogIdMatchesToken(id, token))) {
      return false;
    }
    return true;
  }

  return false;
}

export function planObjectFootprintKind(object: InteriorObjectEntity): PlanFootprintKind {
  if (isCabinetRunFiller(object)) return "filler";

  const identity = readCabinetIdentity(object);
  const cabinetType = identity?.cabinetType;
  if (cabinetType === "base" || cabinetType === "drawer") return "base";
  if (cabinetType === "wall") return "wall";
  if (cabinetType === "tall") return "tall";
  if (cabinetType === "sink") return "appliance";
  // Run fillers are handled above via isCabinetRunFiller — CabinetType has no "filler" member.

  if (isKitchenAppliancePlanObject(object)) return "appliance";
  return null;
}

export function planObjectFootprintClass(object: InteriorObjectEntity): string {
  const kind = planObjectFootprintKind(object);
  if (!kind) return "";
  return `is-footprint-${kind}`;
}
