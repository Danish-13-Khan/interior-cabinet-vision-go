import type { ApartmentOpeningSpec } from "../types";

/** 1 BHK doors, arch, and daylight openings (kitchen window + bath ventilator). */
export const ONE_BHK_OPENINGS: readonly ApartmentOpeningSpec[] = [
  { kind: "door", between: ["living", "bedroom"], offsetMm: 400, widthMm: 900 },
  { kind: "door", between: ["kitchen", "utility"], offsetMm: 1700, widthMm: 700 },
  { kind: "door", between: ["bedroom", "bath"], offsetMm: 300, widthMm: 700 },
  { kind: "opening", between: ["living", "kitchen"], offsetMm: 600, widthMm: 1400 },
  { kind: "door", between: { room: "living", side: "west" }, offsetMm: 400, widthMm: 900 },
  {
    kind: "window",
    between: { room: "living", side: "south" },
    offsetMm: 1300,
    widthMm: 1600,
    sillHeightMm: 900,
  },
  {
    kind: "window",
    between: { room: "bedroom", side: "east" },
    offsetMm: 1400,
    widthMm: 1200,
    sillHeightMm: 900,
  },
  {
    kind: "window",
    between: { room: "bath", side: "east" },
    offsetMm: 600,
    widthMm: 500,
    heightMm: 500,
    sillHeightMm: 1800,
  },
];
