import type { LengthUnit } from "./protocol";

const TO_MM: Record<LengthUnit, number> = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };

export function toMillimetres(value: number, unit: LengthUnit): number {
  return value * TO_MM[unit];
}

/** Largest bounding-box side in the file's raw numbers. */
export function guessUnitFromSize(largestSide: number): LengthUnit {
  if (largestSide < 10) return "m";
  if (largestSide < 30) return "ft";
  if (largestSide < 600) return "cm";
  return "mm";
}

export function guessObjUnit(source: string, largestSide: number): LengthUnit {
  const head = source.slice(0, 4000);
  if (/^\s*#\s*Blender/m.test(head)) return "m";
  if (/SketchUp/i.test(head)) return "in";
  if (/Maya/i.test(head)) return "cm";
  return guessUnitFromSize(largestSide);
}

export function sizesUnderUnits(largestSide: number): Record<LengthUnit, number> {
  return {
    mm: toMillimetres(largestSide, "mm"),
    cm: toMillimetres(largestSide, "cm"),
    m: toMillimetres(largestSide, "m"),
    in: toMillimetres(largestSide, "in"),
    ft: toMillimetres(largestSide, "ft"),
  };
}

export const LENGTH_UNITS: LengthUnit[] = ["mm", "cm", "m", "in", "ft"];
