import {
  BUILTIN_COUNTERTOP_LIBRARY,
  BUILTIN_DOOR_STYLE_LIBRARY,
  BUILTIN_MATERIAL_LIBRARY,
  BUILTIN_STANDARDS_PACKS,
} from "./builtins";
import { HARDWARE_CATALOG, type HardwareItem } from "../hardwareSystem";
import type {
  CountertopLibraryEntry,
  DoorStyleLibraryEntry,
  MaterialLibraryEntry,
  StandardsLibraryEntry,
  WorkshopLibraryPack,
} from "./types";

export function listDoorStyleLibrary(pack: WorkshopLibraryPack): DoorStyleLibraryEntry[] {
  const map = new Map(BUILTIN_DOOR_STYLE_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.doorStyles) map.set(item.id, item);
  return Array.from(map.values());
}

export function listMaterialLibrary(pack: WorkshopLibraryPack): MaterialLibraryEntry[] {
  const map = new Map(BUILTIN_MATERIAL_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.materials) map.set(item.id, item);
  return Array.from(map.values());
}

export function listHardwareLibrary(pack: WorkshopLibraryPack): HardwareItem[] {
  const map = new Map<string, HardwareItem>(
    HARDWARE_CATALOG.map((item) => [item.id, item]),
  );
  for (const item of pack.hardware) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function listCountertopLibrary(pack: WorkshopLibraryPack): CountertopLibraryEntry[] {
  const map = new Map(BUILTIN_COUNTERTOP_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.countertops) map.set(item.id, item);
  return Array.from(map.values());
}

export function listStandardsLibrary(pack: WorkshopLibraryPack): StandardsLibraryEntry[] {
  const map = new Map(BUILTIN_STANDARDS_PACKS.map((item) => [item.id, item]));
  for (const item of pack.standardsPacks) map.set(item.id, item);
  return Array.from(map.values());
}

export function librarySummary(pack: WorkshopLibraryPack) {
  return {
    doorStyles: listDoorStyleLibrary(pack).length,
    materials: listMaterialLibrary(pack).length,
    hardware: listHardwareLibrary(pack).length,
    countertops: listCountertopLibrary(pack).length,
    standardsPacks: listStandardsLibrary(pack).length,
    cabinetPresets: pack.cabinetPresets.length,
    userOwned:
      pack.doorStyles.length +
      pack.materials.length +
      pack.hardware.length +
      pack.countertops.length +
      pack.standardsPacks.length +
      pack.cabinetPresets.length,
  };
}
