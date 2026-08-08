import type { CabinetSceneItem } from "../../domain/cabinetGeometry";
import { Vector3 } from "three";

export function getCabinetWorldCenter(cabinet: CabinetSceneItem): [number, number, number] {
  return [
    cabinet.placement.x / 1000,
    cabinet.placement.y / 1000 + cabinet.config.dimensions.height / 2000,
    cabinet.placement.z / 1000,
  ];
}

export function getSceneTarget(items: CabinetSceneItem[], selectedCabinetId: string | null) {
  const selectedCabinet = items.find((item) => item.id === selectedCabinetId);

  if (selectedCabinet) {
    const [x, y, z] = getCabinetWorldCenter(selectedCabinet);
    return new Vector3(x, y, z);
  }

  if (items.length === 0) {
    return new Vector3(0, 0.7, 0);
  }

  const sum = items.reduce(
    (accumulator, item) => {
      const [x, y, z] = getCabinetWorldCenter(item);
      accumulator.x += x;
      accumulator.z += z;
      accumulator.y = Math.max(accumulator.y, y);
      return accumulator;
    },
    { x: 0, y: 0.8, z: 0 },
  );

  return new Vector3(sum.x / items.length, sum.y, sum.z / items.length);
}
