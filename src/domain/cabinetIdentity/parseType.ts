import type { CabinetType } from "../cabinetCapabilities";

const CABINET_TYPES: readonly CabinetType[] = [
  "base",
  "wall",
  "tall",
  "drawer",
  "sink",
  "corner",
  "open-shelf",
  "almirah",
  "table",
  "chair",
  "sofa",
  "mirror",
];

/** Parse a technical cabinet type. Never falls back to another family. */
export function parseCabinetType(value: unknown): CabinetType | null {
  return typeof value === "string" && (CABINET_TYPES as readonly string[]).includes(value)
    ? (value as CabinetType)
    : null;
}
