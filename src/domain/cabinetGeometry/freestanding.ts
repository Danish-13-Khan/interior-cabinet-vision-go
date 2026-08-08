import {
  clampCabinetConfig,
  millimetresToMetres,
  type CabinetConfig,
} from "../cabinetDimensions";
import type { CabinetPanelGeometry, Vector3Tuple } from "./types";

export function createFreestandingGeometry(config: CabinetConfig): CabinetPanelGeometry[] {
  const safeConfig = clampCabinetConfig(config);
  const { width, height, depth, boardThickness, backPanelThickness } = safeConfig.dimensions;
  const outerWidth = millimetresToMetres(width);
  const outerHeight = millimetresToMetres(height);
  const outerDepth = millimetresToMetres(depth);
  const board = millimetresToMetres(boardThickness);
  const accent = millimetresToMetres(Math.max(backPanelThickness, 12));

  switch (safeConfig.type) {
    case "table": {
      const legSize = Math.min(board, 0.08);
      const topThickness = Math.max(board, 0.03);
      const topY = outerHeight / 2 - topThickness / 2;
      const legHeight = outerHeight - topThickness;
      const legY = -outerHeight / 2 + legHeight / 2;
      const legInsetX = outerWidth / 2 - legSize * 1.15;
      const legInsetZ = outerDepth / 2 - legSize * 1.15;

      return [
        {
          name: "table-top",
          label: "Table Top",
          size: [outerWidth, topThickness, outerDepth],
          position: [0, topY, 0],
          material: "board",
        },
        ...[
          [-legInsetX, legY, -legInsetZ],
          [legInsetX, legY, -legInsetZ],
          [-legInsetX, legY, legInsetZ],
          [legInsetX, legY, legInsetZ],
        ].map((position, index) => ({
          name: `leg-${index + 1}`,
          label: `Leg ${index + 1}`,
          size: [legSize, legHeight, legSize] as Vector3Tuple,
          position: position as Vector3Tuple,
          material: "board" as const,
        })),
      ];
    }
    case "chair": {
      const seatThickness = Math.max(board, 0.028);
      const legSize = Math.min(board * 0.75, 0.05);
      const seatWidth = outerWidth;
      const seatDepth = outerDepth * 0.7;
      const seatY = -outerHeight / 2 + outerHeight * 0.48;
      const legHeight = seatY - seatThickness / 2 + outerHeight / 2;
      const backHeight = outerHeight - legHeight - seatThickness;
      const backY = seatY + seatThickness / 2 + backHeight / 2;
      const legInsetX = seatWidth / 2 - legSize * 1.2;
      const legInsetZ = seatDepth / 2 - legSize * 1.2;
      const backZ = -(outerDepth / 2) + board / 2;

      return [
        {
          name: "seat",
          label: "Seat",
          size: [seatWidth, seatThickness, seatDepth],
          position: [0, seatY, 0],
          material: "board",
        },
        {
          name: "back-rest",
          label: "Back Rest",
          size: [seatWidth, backHeight, board],
          position: [0, backY, backZ],
          material: "back",
        },
        ...[
          [-legInsetX, -outerHeight / 2 + legHeight / 2, -legInsetZ],
          [legInsetX, -outerHeight / 2 + legHeight / 2, -legInsetZ],
          [-legInsetX, -outerHeight / 2 + legHeight / 2, legInsetZ],
          [legInsetX, -outerHeight / 2 + legHeight / 2, legInsetZ],
        ].map((position, index) => ({
          name: `leg-${index + 1}`,
          label: `Leg ${index + 1}`,
          size: [legSize, legHeight, legSize] as Vector3Tuple,
          position: position as Vector3Tuple,
          material: "board" as const,
        })),
      ];
    }
    case "sofa": {
      const baseHeight = outerHeight * 0.34;
      const seatHeight = outerHeight * 0.14;
      const armWidth = Math.min(outerWidth * 0.12, 0.14);
      const backHeight = outerHeight * 0.62;
      const backThickness = Math.min(outerDepth * 0.18, 0.16);

      return [
        {
          name: "base",
          label: "Base",
          size: [outerWidth, baseHeight, outerDepth],
          position: [0, -outerHeight / 2 + baseHeight / 2, 0],
          material: "board",
        },
        {
          name: "seat-cushion",
          label: "Seat Cushion",
          size: [outerWidth - armWidth * 2, seatHeight, outerDepth * 0.68],
          position: [0, -outerHeight / 2 + baseHeight + seatHeight / 2, outerDepth * 0.05],
          material: "door",
        },
        {
          name: "back-rest",
          label: "Back Rest",
          size: [outerWidth, backHeight, backThickness],
          position: [0, -outerHeight / 2 + baseHeight + backHeight / 2, -(outerDepth / 2) + backThickness / 2],
          material: "back",
        },
        {
          name: "left-arm",
          label: "Left Arm",
          size: [armWidth, backHeight, outerDepth * 0.92],
          position: [-(outerWidth / 2) + armWidth / 2, -outerHeight / 2 + baseHeight + backHeight / 2, 0],
          material: "board",
        },
        {
          name: "right-arm",
          label: "Right Arm",
          size: [armWidth, backHeight, outerDepth * 0.92],
          position: [(outerWidth / 2) - armWidth / 2, -outerHeight / 2 + baseHeight + backHeight / 2, 0],
          material: "board",
        },
      ];
    }
    case "mirror": {
      const frame = Math.min(board, Math.min(outerWidth, outerHeight) * 0.1);
      const glassThickness = Math.max(accent, 0.012);
      const frameDepth = Math.max(board, 0.03);

      return [
        {
          name: "mirror-glass",
          label: "Mirror Glass",
          size: [outerWidth - frame * 2, outerHeight - frame * 2, glassThickness],
          position: [0, 0, 0],
          material: "door",
        },
        {
          name: "frame-left",
          label: "Frame Left",
          size: [frame, outerHeight, frameDepth],
          position: [-(outerWidth / 2) + frame / 2, 0, 0],
          material: "board",
        },
        {
          name: "frame-right",
          label: "Frame Right",
          size: [frame, outerHeight, frameDepth],
          position: [(outerWidth / 2) - frame / 2, 0, 0],
          material: "board",
        },
        {
          name: "frame-top",
          label: "Frame Top",
          size: [outerWidth - frame * 2, frame, frameDepth],
          position: [0, outerHeight / 2 - frame / 2, 0],
          material: "board",
        },
        {
          name: "frame-bottom",
          label: "Frame Bottom",
          size: [outerWidth - frame * 2, frame, frameDepth],
          position: [0, -(outerHeight / 2) + frame / 2, 0],
          material: "board",
        },
      ];
    }
    default:
      return [];
  }
}
