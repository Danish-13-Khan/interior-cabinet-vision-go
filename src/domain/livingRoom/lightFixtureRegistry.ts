import type { LightKind, ParameterValue } from "../interiorProject";

/** Nine fixture ids. `LightKind` stays the five validated kinds (roadmap D2). */
export const LIGHT_FIXTURE_KIND_IDS = [
  "cove",
  "rope",
  "profile",
  "panel",
  "cob",
  "track",
  "ceiling-downlight",
  "pendant",
  "under-cabinet",
] as const;

export type LightFixtureKind = typeof LIGHT_FIXTURE_KIND_IDS[number];
export type LightFixtureCategory = "wall" | "ceiling" | "cabinet";
export type LightMountKind = "free" | "object" | "wall" | "ceiling";
export type LightProfileFinish = "aluminium" | "black" | "white";
export type LightStripOrientation = "horizontal" | "vertical";

/** Free-placement elevation and the scalar defaults copied onto a new fixture. */
export type LightFixtureDefaults = {
  intensity: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  rangeMm: number;
  /** Used when `absoluteYMm` is omitted: y = room height − this drop. */
  ceilingDropMm: number;
  /** Free placement at a fixed height above the finished floor. */
  absoluteYMm?: number;
  /** Seeded as parameters.colorTemperatureK. Not the global 3000 K fallback. */
  colorTemperatureK: number;
  /** Euler X of a free fixture. Cove aims up (90); down-lights use −90. */
  rotationX: number;
  /** Initial wall-mount centre when the kind is not a fitted cove. */
  wallCenterHeightMm?: number;
  beamAngleDeg?: number;
  headCount?: number;
  aimAngleDeg?: number;
  profileFinish?: LightProfileFinish;
  orientation?: LightStripOrientation;
};

export type LightFixtureDefinition = {
  id: LightFixtureKind;
  name: string;
  kind: Extract<LightKind, "area" | "point" | "spot">;
  category: LightFixtureCategory;
  /** Hosts the UI may offer. `addRoomLightFixture` refuses anything else. */
  mounts: readonly LightMountKind[];
  defaults: LightFixtureDefaults;
};

export const LIGHT_FIXTURE_CATEGORY_LABELS: Record<LightFixtureCategory, string> = {
  wall: "Wall lighting",
  ceiling: "Ceiling lighting",
  cabinet: "Cabinet lighting",
};

const area = (over: Partial<LightFixtureDefaults> = {}): LightFixtureDefaults => ({
  intensity: 3,
  widthMm: 1000,
  heightMm: 20,
  depthMm: 20,
  rangeMm: 5000,
  ceilingDropMm: 80,
  rotationX: -90,
  colorTemperatureK: 3000,
  ...over,
});

const emitter = (over: Partial<LightFixtureDefaults> = {}): LightFixtureDefaults => ({
  ...area({ intensity: 5, widthMm: 100, heightMm: 100, depthMm: 40 }),
  ...over,
});

/**
 * Kelvin seeds: rope 2700, profile 3500, panel 4000 (roadmap intent).
 * The architecture doc lists no other values, so the rest are role defaults:
 * cove / cob / downlight 3000, track / pendant 2700, under-cabinet 4000.
 */
export const LIGHT_FIXTURE_DEFINITIONS: readonly LightFixtureDefinition[] = [
  { id: "ceiling-downlight", name: "Ceiling downlight", kind: "spot", category: "ceiling",
    mounts: ["free", "ceiling"],
    defaults: emitter({ beamAngleDeg: 36, ceilingDropMm: 80, colorTemperatureK: 3000 }) },
  { id: "pendant", name: "Pendant light", kind: "point", category: "ceiling",
    mounts: ["free", "ceiling"],
    defaults: emitter({ depthMm: 100, ceilingDropMm: 650, colorTemperatureK: 2700 }) },
  { id: "under-cabinet", name: "Under-cabinet LED strip", kind: "area", category: "cabinet",
    mounts: ["free", "object"],
    defaults: area({ depthMm: 12, absoluteYMm: 1450, colorTemperatureK: 4000 }) },
  { id: "cove", name: "Cove LED strip", kind: "area", category: "wall",
    mounts: ["free", "wall"],
    defaults: area({ depthMm: 40, rotationX: 90, ceilingDropMm: 80, colorTemperatureK: 3000 }) },
  { id: "rope", name: "Rope light", kind: "area", category: "wall",
    mounts: ["free", "wall", "object"],
    defaults: area({ heightMm: 12, depthMm: 12, rotationX: 0, absoluteYMm: 1200, wallCenterHeightMm: 1200,
      colorTemperatureK: 2700 }) },
  { id: "profile", name: "Profile light", kind: "area", category: "wall",
    mounts: ["free", "wall"],
    defaults: area({ heightMm: 30, depthMm: 24, rotationX: 0, absoluteYMm: 1400, wallCenterHeightMm: 1400,
      profileFinish: "aluminium", orientation: "horizontal", colorTemperatureK: 3500 }) },
  { id: "panel", name: "Panel light", kind: "area", category: "ceiling",
    mounts: ["free", "ceiling"],
    defaults: area({ widthMm: 600, heightMm: 600, depthMm: 30, ceilingDropMm: 40, colorTemperatureK: 4000 }) },
  { id: "cob", name: "COB downlight", kind: "spot", category: "ceiling",
    mounts: ["free", "ceiling"],
    defaults: emitter({ widthMm: 90, heightMm: 90, beamAngleDeg: 40, ceilingDropMm: 40, colorTemperatureK: 3000 }) },
  { id: "track", name: "Track light", kind: "spot", category: "ceiling",
    mounts: ["free", "ceiling"],
    defaults: emitter({ widthMm: 1200, heightMm: 40, depthMm: 35, beamAngleDeg: 30, headCount: 3,
      aimAngleDeg: 20, profileFinish: "aluminium", ceilingDropMm: 80, colorTemperatureK: 2700 }) },
];

const BY_KIND = new Map(LIGHT_FIXTURE_DEFINITIONS.map((definition) => [definition.id, definition]));

export function isLightFixtureKind(value: unknown): value is LightFixtureKind {
  return typeof value === "string" && (LIGHT_FIXTURE_KIND_IDS as readonly string[]).includes(value);
}

export function getLightFixtureDefinition(kind: LightFixtureKind): LightFixtureDefinition {
  const definition = BY_KIND.get(kind);
  if (!definition) throw new Error(`Unknown light fixture kind: ${kind}`);
  return definition;
}

export function lightFixtureDefinitionFor(
  light: { parameters: Record<string, ParameterValue> },
): LightFixtureDefinition | null {
  const kind = light.parameters.fixtureKind;
  return isLightFixtureKind(kind) ? getLightFixtureDefinition(kind) : null;
}

export function listLightFixtureDefinitions(category?: LightFixtureCategory): LightFixtureDefinition[] {
  if (!category) return [...LIGHT_FIXTURE_DEFINITIONS];
  return LIGHT_FIXTURE_DEFINITIONS.filter((definition) => definition.category === category);
}
