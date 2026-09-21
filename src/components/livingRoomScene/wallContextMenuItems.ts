import type { ContextMenuItem } from "../ContextMenu";
import {
  wallContextMenuEntries,
  type WallContextMenuMaterial,
} from "../../domain/livingRoom/wallContextMenu";

export function wallContextMenuItems(args: {
  materials: readonly WallContextMenuMaterial[];
  onHide: () => void;
  onApply: (materialId: string) => void;
  onClear: () => void;
}): ContextMenuItem[] {
  return wallContextMenuEntries(args.materials).map((entry) => {
    if (entry.separator) return { id: entry.id, label: entry.label, separator: true };
    if (entry.id === "hide-wall") {
      return { id: entry.id, label: entry.label, action: args.onHide };
    }
    if (entry.id === "clear-wall-material") {
      return { id: entry.id, label: entry.label, action: args.onClear };
    }
    return {
      id: entry.id,
      label: entry.label,
      disabled: entry.disabled,
      children: entry.children?.map((child) => ({
        id: child.id,
        label: child.label,
        action: () => {
          if (child.materialId) args.onApply(child.materialId);
        },
      })),
    };
  });
}
