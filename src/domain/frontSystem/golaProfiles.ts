import type { CabinetType } from "../cabinetCapabilities";

export type GolaProfileKind = "L" | "C" | "wall";
export type GolaProfileSize = { heightMm: number; depthMm: number };
export type GolaProfiles = Record<GolaProfileKind, GolaProfileSize>;

export type FrontSystem =
  | { kind: "handled" }
  | { kind: "gola"; profiles: GolaProfiles };

type Range = { min: number; max: number; default: number };

export type GolaProfileCatalogEntry = {
  kind: GolaProfileKind;
  label: string;
  application: string;
  hardwareId: string;
  heightMm: Range;
  depthMm: Range;
};

/** Standard gola sections (factory table, 2026-10-05). Sizes are configurable inside these ranges. */
export const GOLA_PROFILE_CATALOG: Record<GolaProfileKind, GolaProfileCatalogEntry> = {
  L: {
    kind: "L",
    label: "J / L profile",
    application: "Under the countertop, above the top drawer or door.",
    hardwareId: "gola-l",
    heightMm: { min: 56.5, max: 68, default: 60 },
    depthMm: { min: 26, max: 27.5, default: 27 },
  },
  C: {
    kind: "C",
    label: "C profile",
    application: "Between two stacked drawers so one grip serves both.",
    hardwareId: "gola-c",
    heightMm: { min: 73, max: 75, default: 74 },
    depthMm: { min: 26, max: 27.2, default: 27 },
  },
  wall: {
    kind: "wall",
    label: "Wall-unit profile",
    application: "Slim profile hidden under upper wall cabinets.",
    hardwareId: "gola-wall",
    heightMm: { min: 18.8, max: 27.2, default: 23 },
    depthMm: { min: 18.8, max: 27, default: 23 },
  },
};

export const GOLA_PROFILE_KINDS: GolaProfileKind[] = ["L", "C", "wall"];

function clampToRange(value: unknown, range: Range): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return range.default;
  return Math.round(Math.min(range.max, Math.max(range.min, numeric)) * 10) / 10;
}

export function defaultGolaProfiles(): GolaProfiles {
  const size = (kind: GolaProfileKind) => ({
    heightMm: GOLA_PROFILE_CATALOG[kind].heightMm.default,
    depthMm: GOLA_PROFILE_CATALOG[kind].depthMm.default,
  });
  return { L: size("L"), C: size("C"), wall: size("wall") };
}

export function clampGolaProfileSize(kind: GolaProfileKind, size: Partial<GolaProfileSize> | undefined): GolaProfileSize {
  const entry = GOLA_PROFILE_CATALOG[kind];
  return { heightMm: clampToRange(size?.heightMm, entry.heightMm), depthMm: clampToRange(size?.depthMm, entry.depthMm) };
}

export function normalizeFrontSystem(value: unknown): FrontSystem {
  const raw = value as { kind?: unknown; profiles?: Partial<Record<GolaProfileKind, Partial<GolaProfileSize>>> } | undefined;
  if (raw?.kind !== "gola") return { kind: "handled" };
  return {
    kind: "gola",
    profiles: {
      L: clampGolaProfileSize("L", raw.profiles?.L),
      C: clampGolaProfileSize("C", raw.profiles?.C),
      wall: clampGolaProfileSize("wall", raw.profiles?.wall),
    },
  };
}

/** Which profiles a cabinet type uses: wall units take the slim profile; tall units only C between stacked fronts. */
export function golaProfilesForType(type: CabinetType): GolaProfileKind[] {
  if (type === "wall") return ["wall"];
  if (type === "tall") return ["C"];
  return ["L", "C"];
}
