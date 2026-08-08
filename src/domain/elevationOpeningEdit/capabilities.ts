import type { CabinetConfig } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import {
  collectOpeningLeaves,
  findOpeningNode,
  getActiveOpeningLeaf,
} from "../cabinetOpeningStructure";
import type { ElevationOpeningToolbarState } from "./types";

export function getElevationOpeningToolbarState(
  config: CabinetConfig | null | undefined,
  activeOpeningIdOverride?: string | null,
): ElevationOpeningToolbarState {
  if (!config) {
    return {
      supportsOpenings: false,
      activeOpeningId: null,
      activeLabel: null,
      activeContentType: null,
      leafCount: 0,
      maxLeaves: 0,
      canSplitVertical: false,
      canSplitHorizontal: false,
      allowedContentTypes: [],
    };
  }

  const rules = getFamilyOpeningRules(config.type);
  const composition = resolveCabinetComposition(config);
  const structure = composition.openingStructure;
  if (!rules.supportsOpenings || !structure) {
    return {
      supportsOpenings: false,
      activeOpeningId: null,
      activeLabel: null,
      activeContentType: null,
      leafCount: 0,
      maxLeaves: rules.maxLeaves,
      canSplitVertical: false,
      canSplitHorizontal: false,
      allowedContentTypes: [],
    };
  }

  const leaves = collectOpeningLeaves(structure.root);
  const resolvedActiveId =
    activeOpeningIdOverride &&
    findOpeningNode(structure.root, activeOpeningIdOverride)?.kind === "leaf"
      ? activeOpeningIdOverride
      : structure.activeOpeningId;
  const active = getActiveOpeningLeaf({
    ...structure,
    activeOpeningId: resolvedActiveId,
  });
  const activeNode = active
    ? findOpeningNode(structure.root, active.id)
    : null;
  const activeIsLeaf = activeNode?.kind === "leaf";
  const underLeafCap = leaves.length < rules.maxLeaves;

  return {
    supportsOpenings: true,
    activeOpeningId: active?.id ?? resolvedActiveId,
    activeLabel: active?.label ?? null,
    activeContentType: active?.contentType ?? null,
    leafCount: leaves.length,
    maxLeaves: rules.maxLeaves,
    canSplitVertical:
      Boolean(activeIsLeaf) && rules.allowVerticalSplit && underLeafCap,
    canSplitHorizontal:
      Boolean(activeIsLeaf) && rules.allowHorizontalSplit && underLeafCap,
    allowedContentTypes: [...rules.allowedContentTypes],
  };
}
