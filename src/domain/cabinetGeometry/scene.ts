import {
  clampCabinetConfig,
  isStorageType,
  type CabinetConfig,
  type CabinetInstance,
} from "../cabinetDimensions";
import { createCabinetGeometry } from "./storageGeometry";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetDerivedMetrics, CabinetSceneItem } from "./types";

export function createCabinetDerivedMetrics(
  config: CabinetConfig,
): CabinetDerivedMetrics {
  const safeConfig = clampCabinetConfig(config);

  if (!isStorageType(safeConfig.type)) {
    return {
      openingWidthMm: safeConfig.dimensions.width,
      openingHeightMm: safeConfig.dimensions.height,
      usableShelfDepthMm: safeConfig.dimensions.depth,
      estimatedPanelCount: createCabinetGeometry(safeConfig).length,
    };
  }

  const { safeConfig: measuredConfig, innerWidth, openingHeight, usableShelfDepth } =
    getCabinetMeasurements(config);

  return {
    openingWidthMm: Math.round(innerWidth * 1000),
    openingHeightMm: Math.round(openingHeight * 1000),
    usableShelfDepthMm: Math.round(usableShelfDepth * 1000),
    estimatedPanelCount: createCabinetGeometry(measuredConfig).length,
  };
}

export function createCabinetSceneItem(cabinet: CabinetInstance): CabinetSceneItem {
  return {
    ...cabinet,
    config: clampCabinetConfig(cabinet.config),
    panels: createCabinetGeometry(cabinet.config),
    metrics: createCabinetDerivedMetrics(cabinet.config),
  };
}
