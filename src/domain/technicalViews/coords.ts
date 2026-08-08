import { SCALE } from "./constants";

export function planSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  scale: number = SCALE,
) {
  return {
    x: (svgX - originX) * scale,
    z: (svgY - originY) * scale,
  };
}

export function elevationFrontSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  roomHeightMm: number,
  scale: number = SCALE,
) {
  return {
    x: (svgX - originX) * scale,
    y: roomHeightMm / 2 - (svgY - originY) * scale,
  };
}

export function elevationSideSvgToWorldMm(
  svgX: number,
  svgY: number,
  originX: number,
  originY: number,
  roomHeightMm: number,
  scale: number = SCALE,
) {
  return {
    z: (svgX - originX) * scale,
    y: roomHeightMm / 2 - (svgY - originY) * scale,
  };
}
