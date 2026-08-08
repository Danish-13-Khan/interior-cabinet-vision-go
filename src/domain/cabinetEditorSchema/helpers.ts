import type { CabinetConfig } from "../cabinetDimensions";
import { clampCabinetConfig } from "../cabinetDimensions";
import {
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
  type CabinetComposition,
} from "../cabinetComposition";
import {
  normalizeConstructionSpec,
  shelvesAreAdjustable,
} from "../cabinetConstructionSpec";
import { normalizeCabinetHardware } from "../hardwareSystem";
import type { OpeningContentType } from "../cabinetOpeningStructure";

export const CONTENT_TYPE_LABELS: Record<OpeningContentType, string> = {
  door: "Door Opening",
  "drawer-stack": "Drawer Stack",
  "open-shelf": "Open Shelf Section",
  divider: "Divider Section",
  empty: "Empty",
};

export function compositionOf(config: CabinetConfig): CabinetComposition {
  return resolveCabinetComposition(config);
}

export function constructionOf(config: CabinetConfig) {
  return normalizeConstructionSpec(config.type, config.construction, {
    shelvesAdjustable: compositionOf(config).shelves.adjustable,
  });
}

export function hardwareOf(config: CabinetConfig) {
  return normalizeCabinetHardware(config.type, config.hardware);
}

export function patchHardware(
  config: CabinetConfig,
  patch: Partial<ReturnType<typeof hardwareOf>>,
): CabinetConfig {
  const current = hardwareOf(config);
  return clampCabinetConfig({
    ...config,
    hardware: normalizeCabinetHardware(config.type, { ...current, ...patch }),
  });
}

export function patchComposition(
  config: CabinetConfig,
  patch: (composition: CabinetComposition) => CabinetComposition,
): CabinetConfig {
  const nextComposition = patch(compositionOf(config));
  return clampCabinetConfig({
    ...config,
    composition: nextComposition,
    ...syncFlatFieldsFromComposition(nextComposition),
  });
}

export function patchConstruction(
  config: CabinetConfig,
  patch: Partial<ReturnType<typeof constructionOf>>,
): CabinetConfig {
  const current = constructionOf(config);
  const next = normalizeConstructionSpec(config.type, { ...current, ...patch, faceFrame: {
    ...current.faceFrame,
    ...(patch.faceFrame ?? {}),
  }});
  const withConstruction = { ...config, construction: next };
  if (patch.shelfMount !== undefined) {
    return patchComposition(withConstruction, (composition) => ({
      ...composition,
      shelves: {
        ...composition.shelves,
        adjustable: shelvesAreAdjustable(next.shelfMount),
      },
    }));
  }
  return withConstruction;
}

export function patchOpeningStructure(
  config: CabinetConfig,
  patch: (composition: CabinetComposition) => CabinetComposition["openingStructure"],
): CabinetConfig {
  return patchComposition(config, (composition) => ({
    ...composition,
    openingStructure: patch(composition) ?? composition.openingStructure,
  }));
}
