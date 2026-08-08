import {
  isStorageType,
  millimetresToMetres,
  type CabinetConfig,
} from "../cabinetDimensions";
import { createFreestandingGeometry } from "./freestanding";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetPanelGeometry } from "./types";

export function createCabinetGeometry(
  config: CabinetConfig,
): CabinetPanelGeometry[] {
  if (!isStorageType(config.type)) {
    return createFreestandingGeometry(config);
  }

  const {
    safeConfig,
    shelfCount,
    hasDoors,
    drawerCount,
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
    doorCenterY,
  } = getCabinetMeasurements(config);
  const isSink = safeConfig.type === "sink";
  const isCorner = safeConfig.type === "corner";
  const isDrawer = safeConfig.type === "drawer";
  const wantsOpenFront = safeConfig.type === "open-shelf" || isDrawer;

  const panels: CabinetPanelGeometry[] = [
    {
      name: "left-side-panel",
      label: "Left Side Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [-(outerWidth / 2) + boardThickness / 2, 0, 0],
      material: "board",
    },
    {
      name: "right-side-panel",
      label: "Right Side Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [(outerWidth / 2) - boardThickness / 2, 0, 0],
      material: "board",
    },
    {
      name: isSink ? "front-rail" : "top-panel",
      label: isSink ? "Front Rail" : "Top Panel",
      size: [innerWidth, boardThickness, isSink ? Math.min(outerDepth * 0.16, 0.09) : outerDepth],
      position: [0, topY, isSink ? outerDepth / 2 - Math.min(outerDepth * 0.16, 0.09) / 2 : 0],
      material: "board",
    },
    {
      name: "bottom-panel",
      label: "Bottom Panel",
      size: [innerWidth, boardThickness, outerDepth],
      position: [0, bottomY, 0],
      material: "board",
    },
    {
      name: isCorner ? "back-panel-left" : "back-panel",
      label: isCorner ? "Back Panel Left" : "Back Panel",
      size: [
        isCorner ? innerWidth * 0.56 : innerWidth,
        backPanelHeight,
        backPanelThickness,
      ],
      position: [
        isCorner ? -(innerWidth * 0.22) : 0,
        backPanelY,
        -(outerDepth / 2) + backPanelThickness / 2,
      ],
      material: "back",
    },
  ];

  if (isSink) {
    panels.push({
      name: "back-rail",
      label: "Back Rail",
      size: [innerWidth, boardThickness, Math.min(outerDepth * 0.16, 0.09)],
      position: [0, topY, -(outerDepth / 2) + Math.min(outerDepth * 0.16, 0.09) / 2],
      material: "board",
    });
  }

  if (isCorner) {
    panels.push(
      {
        name: "back-panel-right",
        label: "Back Panel Right",
        size: [backPanelThickness, backPanelHeight, outerDepth * 0.56],
        position: [
          outerWidth / 2 - backPanelThickness / 2,
          backPanelY,
          -(outerDepth * 0.22),
        ],
        material: "back",
      },
      {
        name: "corner-return-panel",
        label: "Corner Return Panel",
        size: [outerWidth * 0.46, boardThickness, outerDepth * 0.46],
        position: [
          outerWidth * 0.18,
          topY - boardThickness * 1.25,
          -(outerDepth * 0.18),
        ],
        material: "board",
      },
    );
  }

  if (toeKickHeightM > 0) {
    panels.push({
      name: "toe-kick",
      label: "Toe Kick",
      size: [innerWidth, toeKickHeightM, boardThickness],
      position: [
        0,
        -(outerHeight / 2) + toeKickHeightM / 2,
        outerDepth / 2 - toeKickInsetM - boardThickness / 2,
      ],
      material: "board",
    });
  }

  if (shelfCount > 0) {
    const shelfSpacing = openingHeight / (shelfCount + 1);

    for (let index = 0; index < shelfCount; index += 1) {
      panels.push({
        name: `shelf-${index + 1}`,
        label: `Shelf ${index + 1}`,
        size: [innerWidth, boardThickness, usableShelfDepth],
        position: [
          0,
          openingBottomY + shelfSpacing * (index + 1),
          shelfCenterZ,
        ],
        material: "board",
      });
    }
  }

  if (drawerCount > 0) {
    const drawerGap = millimetresToMetres(4);
    const availableDrawerHeight = outerHeight - toeKickHeightM - drawerGap * (drawerCount + 2);
    const drawerFrontHeight = availableDrawerHeight / drawerCount;
    const drawerZ = outerDepth / 2 + boardThickness / 2;

    for (let index = 0; index < drawerCount; index += 1) {
      const drawerBottom =
        -outerHeight / 2 + toeKickHeightM + drawerGap + drawerFrontHeight * index + drawerGap * index;
      panels.push({
        name: `drawer-front-${index + 1}`,
        label: `Drawer Front ${index + 1}`,
        size: [outerWidth - drawerGap * 2, drawerFrontHeight, boardThickness],
        position: [0, drawerBottom + drawerFrontHeight / 2, drawerZ],
        material: "door",
      });
    }
  }

  if (hasDoors && !wantsOpenFront) {
    const doorZ = outerDepth / 2 + boardThickness / 2;
    const doorOffsetX = outerWidth / 4 + millimetresToMetres(1);

    panels.push(
      {
        name: "left-door",
        label: "Left Door",
        size: [doorWidth, doorHeight, boardThickness],
        position: [-doorOffsetX, doorCenterY, doorZ],
        material: "door",
      },
      {
        name: "right-door",
        label: "Right Door",
        size: [doorWidth, doorHeight, boardThickness],
        position: [doorOffsetX, doorCenterY, doorZ],
        material: "door",
      },
    );
  }

  if (safeConfig.leftEndPanel) {
    panels.push({
      name: "left-end-panel",
      label: "Left End Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [-(outerWidth / 2) - boardThickness / 2, 0, 0],
      material: "board",
    });
  }

  if (safeConfig.rightEndPanel) {
    panels.push({
      name: "right-end-panel",
      label: "Right End Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [(outerWidth / 2) + boardThickness / 2, 0, 0],
      material: "board",
    });
  }

  return panels;
}
