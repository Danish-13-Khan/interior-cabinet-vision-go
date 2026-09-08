import type { InteriorObjectEntity } from "../interiorProject";
import { finishKindCompatibleWithSelectionSlot } from "./paintSelection";
import type { ManufacturerFinishSeed } from "./manufacturerCatalogueTypes";

/** Catalogue finishes allowed for the active selection slot (same policy as swatches). */
export function manufacturerFinishesCompatibleWithSelectionSlot(
  finishes: readonly ManufacturerFinishSeed[],
  objects: readonly InteriorObjectEntity[],
  slotName: string,
): ManufacturerFinishSeed[] {
  if (!slotName || objects.length === 0) return [...finishes];
  return finishes.filter((finish) =>
    finishKindCompatibleWithSelectionSlot(finish.kind, objects, slotName),
  );
}
