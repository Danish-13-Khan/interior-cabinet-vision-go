import { describe, expect, it, vi } from "vitest";
import { deleteLightOrObject, duplicateLightOrObject, type LightOnlyEditTarget } from "./lightOnlySelectionEdit";

function target(overrides: Partial<LightOnlyEditTarget> = {}): LightOnlyEditTarget & {
  duplicateLight: ReturnType<typeof vi.fn>;
  removeLight: ReturnType<typeof vi.fn>;
  onDuplicate: ReturnType<typeof vi.fn>;
  onDelete: ReturnType<typeof vi.fn>;
  onClearSelection: ReturnType<typeof vi.fn>;
} {
  const duplicateLight = vi.fn();
  const removeLight = vi.fn();
  const onDuplicate = vi.fn();
  const onDelete = vi.fn();
  const onClearSelection = vi.fn();
  return {
    activeLightId: "light-1",
    selectedIds: [],
    lightActions: { duplicateLight, removeLight },
    onDuplicate,
    onDelete,
    onClearSelection,
    duplicateLight,
    removeLight,
    ...overrides,
    lightActions: overrides.lightActions ?? { duplicateLight, removeLight },
  };
}

describe("light-only delete and duplicate", () => {
  it("duplicates and deletes a selected light through the light commands", () => {
    const light = target();
    duplicateLightOrObject(light);
    deleteLightOrObject(light);
    expect(light.duplicateLight).toHaveBeenCalledWith("light-1");
    expect(light.removeLight).toHaveBeenCalledWith("light-1");
    expect(light.onClearSelection).toHaveBeenCalledOnce();
    expect(light.onDuplicate).not.toHaveBeenCalled();
    expect(light.onDelete).not.toHaveBeenCalled();
  });

  it("keeps object delete and duplicate when a light is not the selection", () => {
    const objectSelected = target({ selectedIds: ["sofa"] });
    const nothing = target({ activeLightId: null });
    duplicateLightOrObject(objectSelected);
    deleteLightOrObject(objectSelected);
    duplicateLightOrObject(nothing);
    deleteLightOrObject(nothing);
    expect(objectSelected.duplicateLight).not.toHaveBeenCalled();
    expect(objectSelected.removeLight).not.toHaveBeenCalled();
    expect(objectSelected.onDuplicate).toHaveBeenCalledOnce();
    expect(objectSelected.onDelete).toHaveBeenCalledOnce();
    expect(nothing.onDuplicate).toHaveBeenCalledOnce();
    expect(nothing.onDelete).toHaveBeenCalledOnce();
    expect(nothing.onClearSelection).not.toHaveBeenCalled();
  });
});
