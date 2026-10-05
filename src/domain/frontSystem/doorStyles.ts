import type { CabinetType } from "../cabinetCapabilities";
import { supportsDoors } from "../cabinetCapabilities";

export type DoorStyleKind = "slab" | "shaker" | "glass";
/** Bought keeps one door part per leaf (cut list unchanged); in-house cuts stiles, rails and the panel. */
export type DoorSourcing = "bought" | "in-house";
export type DoorFrontStyle = { style: "shaker" | "glass"; sourcing: DoorSourcing };

export const DOOR_STYLE_PARAMETER = "doorStyle";
export const DOOR_SOURCING_PARAMETER = "doorSourcing";
/** Depth the centre panel or glass sits in the frame groove, each side. */
export const DOOR_PANEL_GROOVE_MM = 10;

export const DOOR_STYLE_OPTIONS: Array<{ value: DoorStyleKind; label: string }> = [
  { value: "slab", label: "Slab" },
  { value: "shaker", label: "Shaker" },
  { value: "glass", label: "Glass" },
];

export function readDoorStyleKind(value: unknown): DoorStyleKind {
  return value === "shaker" || value === "glass" ? value : "slab";
}

/** Slab is the default and is omitted, so slab specs serialise unchanged. */
export function normalizeDoorFrontStyle(type: CabinetType, value: unknown): DoorFrontStyle | undefined {
  if (!supportsDoors(type)) return undefined;
  const raw = value as { style?: unknown; sourcing?: unknown } | undefined;
  const style = readDoorStyleKind(raw?.style);
  if (style === "slab") return undefined;
  return { style, sourcing: raw?.sourcing === "in-house" ? "in-house" : "bought" };
}

export function doorFrontStyleFromParameters(parameters: Record<string, unknown>): DoorFrontStyle | "slab" | null {
  if (!(DOOR_STYLE_PARAMETER in parameters)) return null;
  const style = readDoorStyleKind(parameters[DOOR_STYLE_PARAMETER]);
  if (style === "slab") return "slab";
  return { style, sourcing: parameters[DOOR_SOURCING_PARAMETER] === "in-house" ? "in-house" : "bought" };
}

/** Frame members never take more than a third of the leaf. */
export function doorFrameWidths(leaf: { widthMm: number; heightMm: number }, frame: { stileWidthMm: number; railWidthMm: number }) {
  return {
    stileMm: Math.min(frame.stileWidthMm, leaf.widthMm / 3),
    railMm: Math.min(frame.railWidthMm, leaf.heightMm / 3),
  };
}
