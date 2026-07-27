export type CabinetType =
  | "base"
  | "wall"
  | "tall"
  | "drawer"
  | "sink"
  | "corner"
  | "open-shelf"
  | "almirah"
  | "table"
  | "chair"
  | "sofa"
  | "mirror";

export function isStorageType(type: CabinetType): boolean {
  return (
    type === "base" ||
    type === "wall" ||
    type === "tall" ||
    type === "drawer" ||
    type === "sink" ||
    type === "corner" ||
    type === "open-shelf" ||
    type === "almirah"
  );
}

export function supportsShelves(type: CabinetType): boolean {
  return isStorageType(type);
}

export function supportsDoors(type: CabinetType): boolean {
  return type !== "drawer" && type !== "open-shelf" && isStorageType(type);
}

export function supportsDrawers(type: CabinetType): boolean {
  return (
    type === "drawer" ||
    type === "base" ||
    type === "tall" ||
    type === "almirah"
  );
}

export function supportsToeKick(type: CabinetType): boolean {
  return (
    type === "base" ||
    type === "tall" ||
    type === "drawer" ||
    type === "sink" ||
    type === "corner" ||
    type === "open-shelf" ||
    type === "almirah"
  );
}

export function supportsWallPlacement(type: CabinetType): boolean {
  return type === "wall" || type === "mirror";
}

export function supportsEndPanels(type: CabinetType): boolean {
  return isStorageType(type);
}

export function supportsCountertop(type: CabinetType): boolean {
  return (
    type === "base" ||
    type === "drawer" ||
    type === "sink" ||
    type === "corner" ||
    type === "open-shelf"
  );
}
