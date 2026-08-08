import type { CabinetConfig } from "../cabinetDimensions";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetDimensionGuide } from "./types";

export function createCabinetDimensionGuides(
  config: CabinetConfig,
): CabinetDimensionGuide[] {
  const { safeConfig, outerWidth, outerHeight, outerDepth } =
    getCabinetMeasurements(config);

  const widthGuideY = -(outerHeight / 2) - 0.11;
  const widthGuideZ = (outerDepth / 2) + 0.08;
  const heightGuideX = -(outerWidth / 2) - 0.12;
  const heightGuideZ = (outerDepth / 2) + 0.05;
  const depthGuideX = (outerWidth / 2) + 0.12;
  const depthGuideY = -(outerHeight / 2) - 0.01;

  return [
    {
      id: "width",
      label: `${safeConfig.dimensions.width} mm`,
      points: [
        [-(outerWidth / 2), widthGuideY, widthGuideZ],
        [outerWidth / 2, widthGuideY, widthGuideZ],
      ],
      labelPosition: [0, widthGuideY - 0.04, widthGuideZ],
    },
    {
      id: "height",
      label: `${safeConfig.dimensions.height} mm`,
      points: [
        [heightGuideX, -(outerHeight / 2), heightGuideZ],
        [heightGuideX, outerHeight / 2, heightGuideZ],
      ],
      labelPosition: [heightGuideX - 0.08, 0, heightGuideZ],
    },
    {
      id: "depth",
      label: `${safeConfig.dimensions.depth} mm`,
      points: [
        [depthGuideX, depthGuideY, -(outerDepth / 2)],
        [depthGuideX, depthGuideY, outerDepth / 2],
      ],
      labelPosition: [depthGuideX + 0.08, depthGuideY, 0],
    },
  ];
}
