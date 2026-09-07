import type { FinishUvRebind } from "../../domain/catalog/finishRebind";
import type { InteriorObjectEntity, WallEntity } from "../../domain/interiorProject";

export type SurfacePaintImportApply = {
  wallId?: string;
  floor?: boolean;
  ceiling?: boolean;
  selection?: { objectIds: readonly string[]; slotName?: string };
};

type PaintTarget = "floor" | "ceiling" | "wall" | "selection";

export function surfacePaintColourRebinds(input: {
  target: PaintTarget;
  wall: WallEntity | null;
  selectedObjects: InteriorObjectEntity[];
  activeSlot: string;
}): FinishUvRebind[] {
  if (input.target === "floor") return [{ kind: "floor" }];
  if (input.target === "ceiling") return [{ kind: "ceiling" }];
  if (input.target === "wall" && input.wall) return [{ kind: "wall", wallId: input.wall.id }];
  if (input.target === "selection" && input.activeSlot) {
    return input.selectedObjects.map((object) => ({
      kind: "object" as const,
      objectId: object.id,
      slotName: input.activeSlot,
    }));
  }
  return [];
}

export function surfacePaintImportApply(input: {
  target: PaintTarget;
  wall: WallEntity | null;
  selectedObjects: InteriorObjectEntity[];
  activeSlot: string;
  canPaintSelection: boolean;
}): SurfacePaintImportApply | undefined {
  if (input.target === "floor") return { floor: true };
  if (input.target === "ceiling") return { ceiling: true };
  if (input.target === "wall" && input.wall) return { wallId: input.wall.id };
  if (input.target === "selection" && input.canPaintSelection) {
    return {
      selection: {
        objectIds: input.selectedObjects.map((object) => object.id),
        slotName: input.activeSlot || undefined,
      },
    };
  }
  return undefined;
}
