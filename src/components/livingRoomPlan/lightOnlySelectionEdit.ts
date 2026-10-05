/** Delete/duplicate target shared by the contextual rail and plan hotkeys. */
export type LightOnlyEditTarget = {
  activeLightId: string | null;
  selectedIds: readonly string[];
  lightActions: {
    duplicateLight: (id: string) => void;
    removeLight: (id: string) => void;
  };
  onDuplicate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
};

/** A light is the selection only when no object is selected. */
export function duplicateLightOrObject(target: LightOnlyEditTarget) {
  const lightOnly = Boolean(target.activeLightId) && target.selectedIds.length === 0;
  if (lightOnly && target.activeLightId) target.lightActions.duplicateLight(target.activeLightId);
  else target.onDuplicate();
}

export function deleteLightOrObject(target: LightOnlyEditTarget) {
  const lightOnly = Boolean(target.activeLightId) && target.selectedIds.length === 0;
  if (lightOnly && target.activeLightId) {
    target.lightActions.removeLight(target.activeLightId);
    target.onClearSelection();
  } else target.onDelete();
}
