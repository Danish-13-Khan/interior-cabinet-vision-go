import {
  isStorageType,
  millimetresToMetres,
  type CabinetConfig,
} from "../cabinetDimensions";
import { createFreestandingGeometry } from "./freestanding";
import { layoutCabinetElevationFace, type OpeningFaceRect } from "../openingLayout";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetPanelGeometry } from "./types";

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.8;
}

function openingBoundaryPanels(
  openings: OpeningFaceRect[],
  config: CabinetConfig,
  usableDepth: number,
  shelfCenterZ: number,
): CabinetPanelGeometry[] {
  const panels: CabinetPanelGeometry[] = [];
  const seen = new Set<string>();
  const board = millimetresToMetres(config.dimensions.boardThickness);
  const outerWidth = millimetresToMetres(config.dimensions.width);
  const outerHeight = millimetresToMetres(config.dimensions.height);
  const toeKick = millimetresToMetres(config.toeKickHeight);
  const layout = layoutCabinetElevationFace(config);

  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const a = openings[i]!;
      const b = openings[j]!;
      const aRight = a.xMm + a.widthMm;
      const bRight = b.xMm + b.widthMm;
      const aTop = a.yMm + a.heightMm;
      const bTop = b.yMm + b.heightMm;

      if (nearlyEqual(aRight, b.xMm) || nearlyEqual(bRight, a.xMm)) {
        const xMm = nearlyEqual(aRight, b.xMm) ? aRight : bRight;
        const start = Math.max(a.yMm, b.yMm);
        const end = Math.min(aTop, bTop);
        const key = `v-${Math.round(xMm)}-${Math.round(start)}-${Math.round(end)}`;
        if (end - start > 1 && !seen.has(key)) {
          seen.add(key);
          panels.push({
            name: `assembly-divider-${seen.size}`,
            label: "Assembly Divider",
            size: [board, millimetresToMetres(end - start), usableDepth],
            position: [
              -outerWidth / 2 + millimetresToMetres(layout.leftFillerMm + xMm),
              -outerHeight / 2 + toeKick + millimetresToMetres((start + end) / 2),
              shelfCenterZ,
            ],
            material: "board",
          });
        }
      }

      if (nearlyEqual(aTop, b.yMm) || nearlyEqual(bTop, a.yMm)) {
        const yMm = nearlyEqual(aTop, b.yMm) ? aTop : bTop;
        const start = Math.max(a.xMm, b.xMm);
        const end = Math.min(aRight, bRight);
        const key = `h-${Math.round(yMm)}-${Math.round(start)}-${Math.round(end)}`;
        if (end - start > 1 && !seen.has(key)) {
          seen.add(key);
          panels.push({
            name: `assembly-partition-${seen.size}`,
            label: "Assembly Partition",
            size: [millimetresToMetres(end - start), board, usableDepth],
            position: [
              -outerWidth / 2 + millimetresToMetres(layout.leftFillerMm + (start + end) / 2),
              -outerHeight / 2 + toeKick + millimetresToMetres(yMm),
              shelfCenterZ,
            ],
            material: "board",
          });
        }
      }
    }
  }
  return panels;
}

function openingComponentPanels(
  config: CabinetConfig,
  outerDepth: number,
  boardThickness: number,
  usableShelfDepth: number,
  shelfCenterZ: number,
): CabinetPanelGeometry[] {
  const layout = layoutCabinetElevationFace(config);
  const outerWidth = millimetresToMetres(config.dimensions.width);
  const outerHeight = millimetresToMetres(config.dimensions.height);
  const toeKick = millimetresToMetres(config.toeKickHeight);
  const frontZ = outerDepth / 2 + boardThickness / 2;
  const gap = millimetresToMetres(3);
  const panels = openingBoundaryPanels(
    layout.openings,
    config,
    usableShelfDepth,
    shelfCenterZ,
  );

  for (const opening of layout.openings) {
    const x =
      -outerWidth / 2 +
      millimetresToMetres(layout.leftFillerMm + opening.xMm + opening.widthMm / 2);
    const y =
      -outerHeight / 2 +
      toeKick +
      millimetresToMetres(opening.yMm + opening.heightMm / 2);
    const width = millimetresToMetres(opening.widthMm);
    const height = millimetresToMetres(opening.heightMm);

    if (opening.contentType === "door") {
      const count = opening.doorStyle === "single" ? 1 : 2;
      const leafWidth = (width - gap * (count + 1)) / count;
      for (let index = 0; index < count; index += 1) {
        panels.push({
          name:
            layout.openings.length === 1 && count === 2
              ? index === 0
                ? "left-door"
                : "right-door"
              : layout.openings.length === 1
                ? "door"
                : `door-${opening.id}-${index + 1}`,
          label: `${opening.label} Door ${index + 1}`,
          size: [leafWidth, Math.max(gap, height - gap * 2), boardThickness],
          position: [
            x - width / 2 + gap + leafWidth / 2 + index * (leafWidth + gap),
            y,
            frontZ,
          ],
          material: "door",
        });
      }
    }

    if (opening.contentType === "drawer-stack") {
      const count = Math.max(1, opening.drawerCount);
      const availableHeight = height - gap * (count + 1);
      const ratios =
        opening.drawerRatios?.length === count
          ? opening.drawerRatios
          : Array.from({ length: count }, () => 1 / count);
      let drawerCursor = y - height / 2 + gap;
      for (let index = 0; index < count; index += 1) {
        const frontHeight = availableHeight * (ratios[index] ?? 1 / count);
        panels.push({
          name:
            layout.openings.length === 1
              ? `drawer-front-${index + 1}`
              : `drawer-${opening.id}-${index + 1}`,
          label: `${opening.label} Drawer ${index + 1}`,
          size: [Math.max(gap, width - gap * 2), frontHeight, boardThickness],
          position: [
            x,
            drawerCursor + frontHeight / 2,
            frontZ,
          ],
          material: "door",
        });
        drawerCursor += frontHeight + gap;
      }
    }

    if (
      (opening.contentType === "door" || opening.contentType === "open-shelf") &&
      opening.shelfCount > 0
    ) {
      const spacing = height / (opening.shelfCount + 1);
      for (let index = 0; index < opening.shelfCount; index += 1) {
        panels.push({
          name:
            layout.openings.length === 1
              ? `shelf-${index + 1}`
              : `shelf-${opening.id}-${index + 1}`,
          label: `${opening.label} Shelf ${index + 1}`,
          size: [Math.max(boardThickness, width - gap * 2), boardThickness, usableShelfDepth],
          position: [
            x,
            y - height / 2 + spacing * (index + 1),
            shelfCenterZ,
          ],
          material: "board",
        });
      }
    }
  }
  return panels;
}

export function createCabinetGeometry(
  config: CabinetConfig,
): CabinetPanelGeometry[] {
  if (!isStorageType(config.type)) {
    return createFreestandingGeometry(config);
  }

  const {
    safeConfig,
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
    backPanelHeight,
    backPanelY,
    usableShelfDepth,
    shelfCenterZ,
  } = getCabinetMeasurements(config);
  const isSink = safeConfig.type === "sink";
  const isCorner = safeConfig.type === "corner";

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

  panels.push(
    ...openingComponentPanels(
      safeConfig,
      outerDepth,
      boardThickness,
      usableShelfDepth,
      shelfCenterZ,
    ),
  );

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
