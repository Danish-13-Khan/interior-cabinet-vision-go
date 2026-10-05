import type { CabinetConfig } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import type { OpeningNode, OpeningStructure } from "../cabinetOpeningStructure";
import {
  SLIDING_LEAF_COUNT_PARAMETER,
  SLIDING_OVERLAP_PARAMETER,
  SLIDING_TRACK_ALLOWANCE_PARAMETER,
  SLIDING_TRACK_KIND_PARAMETER,
  WARDROBE_DOORS_PARAMETER,
  normalizeSlidingDoorSpec,
  supportsSlidingDoors,
  type SlidingDoorSpec,
  type SlidingLeafCount,
  type SlidingTrackKind,
} from "./slidingDefaults";

type Parameters = Record<string, string | number | boolean>;
export type WardrobeDoors = "hinged" | "sliding";

/** The cabinet's sliding spec, or null for hinged / non-wardrobe cabinets. */
export function slidingDoorsOf(config: CabinetConfig): SlidingDoorSpec | null {
  return normalizeConstructionSpec(config.type, config.construction).sliding ?? null;
}

/**
 * Overall depth stays the same (plan footprint does not move); the carcass is
 * `depth − trackAllowanceMm` deep and the double track sits in front of it.
 */
export function slidingCarcassDepthMm(config: CabinetConfig, spec: SlidingDoorSpec): number {
  return Math.max(120, config.dimensions.depth - spec.trackAllowanceMm);
}

export function slidingCarcassConfig(config: CabinetConfig, spec: SlidingDoorSpec): CabinetConfig {
  return { ...config, dimensions: { ...config.dimensions, depth: slidingCarcassDepthMm(config, spec) } };
}

export type SlidingOverrides = {
  leafCount?: SlidingLeafCount;
  overlapMm?: number;
  trackKind?: SlidingTrackKind;
  trackAllowanceMm?: number;
};

/** Parameter patch that selects sliding doors; normalises the front system to handled (§3.4). */
export function slidingParametersPatch(overrides: SlidingOverrides = {}): Parameters {
  const patch: Parameters = { [WARDROBE_DOORS_PARAMETER]: "sliding", frontSystem: "handled" };
  if (overrides.leafCount) patch[SLIDING_LEAF_COUNT_PARAMETER] = overrides.leafCount;
  if (overrides.overlapMm !== undefined) patch[SLIDING_OVERLAP_PARAMETER] = overrides.overlapMm;
  if (overrides.trackKind) patch[SLIDING_TRACK_KIND_PARAMETER] = overrides.trackKind;
  if (overrides.trackAllowanceMm !== undefined) {
    patch[SLIDING_TRACK_ALLOWANCE_PARAMETER] = overrides.trackAllowanceMm;
  }
  return patch;
}

export function hingedParametersPatch(): Parameters {
  return { [WARDROBE_DOORS_PARAMETER]: "hinged" };
}

export function readWardrobeDoors(parameters: Parameters): WardrobeDoors | null {
  const value = parameters[WARDROBE_DOORS_PARAMETER];
  return value === "sliding" || value === "hinged" ? value : null;
}

/** Sliding spec from object parameters; `null` = hinged, `undefined` = the object never chose. */
export function slidingSpecFromParameters(parameters: Parameters): SlidingDoorSpec | null | undefined {
  const doors = readWardrobeDoors(parameters);
  if (doors === null) return undefined;
  if (doors === "hinged") return null;
  return normalizeSlidingDoorSpec({
    leafCount: parameters[SLIDING_LEAF_COUNT_PARAMETER],
    overlapMm: parameters[SLIDING_OVERLAP_PARAMETER],
    trackKind: parameters[SLIDING_TRACK_KIND_PARAMETER],
    trackAllowanceMm: parameters[SLIDING_TRACK_ALLOWANCE_PARAMETER],
  });
}

function stampDoorStyle(node: OpeningNode, sliding: boolean, widthMm: number): OpeningNode {
  if (node.kind === "split") {
    return { ...node, children: node.children.map((child) => stampDoorStyle(child, sliding, widthMm)) };
  }
  if (node.contentType !== "door") return node;
  if (sliding) return { ...node, doorStyle: "sliding" };
  return node.doorStyle === "sliding" ? { ...node, doorStyle: widthMm < 600 ? "single" : "double" } : node;
}

/** Door openings carry `doorStyle: "sliding"` while the cabinet slides (derived, never the source). */
export function stampSlidingDoorStyle(
  structure: OpeningStructure | undefined,
  sliding: boolean,
  widthMm: number,
): OpeningStructure | undefined {
  if (!structure) return structure;
  return { ...structure, root: stampDoorStyle(structure.root, sliding, widthMm) };
}

/** Applies `wardrobeDoors` (+ overrides) from object parameters onto the cabinet config. */
export function applySlidingParameters(config: CabinetConfig, parameters: Parameters): CabinetConfig {
  const sliding = slidingSpecFromParameters(parameters);
  if (sliding === undefined || !supportsSlidingDoors(config.type)) return config;
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const { sliding: _previous, ...rest } = spec;
  const nextSpec = sliding ? { ...rest, frontSystem: undefined, sliding } : rest;
  const composition = config.composition
    ? {
        ...config.composition,
        openingStructure: stampSlidingDoorStyle(
          config.composition.openingStructure, Boolean(sliding), config.dimensions.width,
        ),
      }
    : config.composition;
  return {
    ...config,
    ...(composition ? { composition } : {}),
    construction: normalizeConstructionSpec(config.type, nextSpec),
  };
}
