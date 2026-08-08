import {
  clampCabinetConfig,
  millimetresToMetres,
  type CabinetConfig,
} from "../cabinetDimensions";
import type { PanelName } from "./types";

function toPanelLabel(name: string): string {
  return name
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getPanelDisplayName(name: PanelName): string {
  return toPanelLabel(name);
}

export function getCabinetMeasurements(config: CabinetConfig) {
  const safeConfig = clampCabinetConfig(config);
  const {
    dimensions,
    shelfCount,
    toeKickHeight,
    toeKickInset,
    hasDoors,
    drawerCount: drawerCountRaw,
    leftEndPanel,
    rightEndPanel,
  } =
    safeConfig;
  const outerWidth = millimetresToMetres(dimensions.width);
  const outerHeight = millimetresToMetres(dimensions.height);
  const outerDepth = millimetresToMetres(dimensions.depth);
  const boardThickness = millimetresToMetres(dimensions.boardThickness);
  const backPanelThickness = millimetresToMetres(dimensions.backPanelThickness);
  const toeKickHeightM = millimetresToMetres(toeKickHeight);
  const toeKickInsetM = millimetresToMetres(toeKickInset);
  const innerWidth = outerWidth - boardThickness * 2;
  const topY = outerHeight / 2 - boardThickness / 2;
  const bottomY =
    -outerHeight / 2 + toeKickHeightM + boardThickness / 2;
  const openingBottomY = bottomY + boardThickness / 2;
  const openingTopY = topY - boardThickness / 2;
  const openingHeight = openingTopY - openingBottomY;
  const backPanelHeight = openingHeight;
  const backPanelY = openingBottomY + openingHeight / 2;
  const usableShelfDepth =
    outerDepth - backPanelThickness - millimetresToMetres(30);
  const shelfCenterZ = -outerDepth / 2 + backPanelThickness + usableShelfDepth / 2;
  const frontDoorGap = millimetresToMetres(4);
  const doorBottomY =
    -outerHeight / 2 +
    (toeKickHeightM > 0 ? toeKickHeightM + frontDoorGap : frontDoorGap);
  const doorTopY = outerHeight / 2 - frontDoorGap;
  const doorHeight = doorTopY - doorBottomY;
  const doorWidth = (outerWidth - frontDoorGap * 3) / 2;

  return {
    safeConfig,
    dimensions,
    shelfCount,
    hasDoors,
    drawerCount: drawerCountRaw ?? 0,
    leftEndPanel,
    rightEndPanel,
    outerWidth,
    outerHeight,
    outerDepth,
    boardThickness,
    backPanelThickness,
    toeKickHeightM,
    toeKickInsetM,
    innerWidth,
    topY,
    bottomY,
    openingBottomY,
    openingHeight,
    backPanelHeight,
    backPanelY,
    usableShelfDepth,
    shelfCenterZ,
    doorWidth,
    doorHeight,
    doorCenterY: doorBottomY + doorHeight / 2,
  };
}
