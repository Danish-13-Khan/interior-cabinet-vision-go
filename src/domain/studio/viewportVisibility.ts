export type ViewportObjectFilter = {
  isolatedObjectId: string | null;
  hiddenObjectIds: readonly string[];
};

/** View filter only. Callers must keep manufacturing export on the full project. */
export function viewportShowsObject(objectId: string | null, filter: ViewportObjectFilter) {
  if (!objectId) return true;
  if (filter.hiddenObjectIds.includes(objectId)) return false;
  return !filter.isolatedObjectId || filter.isolatedObjectId === objectId;
}
