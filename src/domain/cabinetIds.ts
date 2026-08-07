import {
  cabinetTypeLabels,
  type CabinetType,
} from "./cabinetDimensions";

export function createCabinetId() {
  return `cabinet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createItemName(type: CabinetType, index: number) {
  return `${cabinetTypeLabels[type]} ${index}`;
}
