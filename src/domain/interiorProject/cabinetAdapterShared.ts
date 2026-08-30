import type { EntityExtensions } from "./types";

export const CABINET_EXTENSION = "cabinetPlanning";
export const MANAGED_BY = "interior-cabinet-adapter";
export const WALL_SIDES = ["back-wall", "left-wall", "right-wall", "front-wall"] as const;
export type AdapterWallSide = (typeof WALL_SIDES)[number];

export function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function extensionValue<T>(extensions: EntityExtensions | undefined): T | null {
  const value = record(extensions)?.[CABINET_EXTENSION];
  return record(value) ? (value as T) : null;
}
