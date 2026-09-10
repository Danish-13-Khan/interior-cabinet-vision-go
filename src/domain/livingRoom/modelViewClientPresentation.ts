/** Client Present hides selection marks and grid without changing authoring state. */

export function modelViewClientPresentationProps(input: {
  presentation: boolean;
  selectedIds: string[];
  activeOpeningId: string | null;
  activeWallId: string | null;
  showGrid: boolean;
}) {
  if (!input.presentation) {
    return {
      selectedIds: input.selectedIds,
      activeOpeningId: input.activeOpeningId,
      activeWallId: input.activeWallId,
      showGrid: input.showGrid,
      interactive: true,
    };
  }
  return {
    selectedIds: [] as string[],
    activeOpeningId: null as string | null,
    activeWallId: null as string | null,
    showGrid: false,
    interactive: false,
  };
}
