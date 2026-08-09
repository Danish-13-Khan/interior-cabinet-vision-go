import {
  addCombinedDocumentationSheet,
  catalogIdFromSheetId,
  getProjectSheetSet,
  placeViewOnSheet,
  renameSheetDocument,
  setActiveSheetDocument,
  setSheetDocumentNotes,
  type SheetViewKind,
} from "../domain/sheetDocuments";
import type { DrawingSheetId } from "../domain/drawingSheets";
import type { CommitProjectChange } from "./projectCommit";

type UseSheetDocumentOpsArgs = {
  commitProjectChange: CommitProjectChange;
  onSelectCatalogSheet: (sheetId: DrawingSheetId) => void;
  onStatus?: (message: string) => void;
};

export function useSheetDocumentOps({
  commitProjectChange,
  onSelectCatalogSheet,
  onStatus,
}: UseSheetDocumentOpsArgs) {
  function patchSheetSet(
    mutate: (
      sheetSet: ReturnType<typeof getProjectSheetSet>,
    ) => ReturnType<typeof getProjectSheetSet>,
    options?: { status?: string; syncCatalog?: boolean },
  ) {
    let activeId = "";
    commitProjectChange((current) => {
      const sheetSet = mutate(getProjectSheetSet(current));
      activeId = sheetSet.activeSheetId;
      return { project: { ...current, sheetSet } };
    });
    if (options?.syncCatalog !== false && activeId) {
      onSelectCatalogSheet(catalogIdFromSheetId(activeId));
    }
    if (options?.status) onStatus?.(options.status);
  }

  function handleSelectSheetDocument(sheetId: string) {
    patchSheetSet((sheetSet) => setActiveSheetDocument(sheetSet, sheetId));
  }

  function handleRenameSheet(sheetId: string, name: string) {
    patchSheetSet((sheetSet) => renameSheetDocument(sheetSet, sheetId, name), {
      status: "Sheet renamed",
      syncCatalog: false,
    });
  }

  function handleSetSheetNotes(sheetId: string, notes: string[]) {
    patchSheetSet(
      (sheetSet) => setSheetDocumentNotes(sheetSet, sheetId, notes),
      { status: "Sheet notes updated", syncCatalog: false },
    );
  }

  function handleAddCombinedSheet() {
    patchSheetSet((sheetSet) => addCombinedDocumentationSheet(sheetSet), {
      status: "Added plan & elevation sheet",
    });
  }

  function handlePlaceView(sheetId: string, viewKind: SheetViewKind) {
    patchSheetSet(
      (sheetSet) => placeViewOnSheet(sheetSet, sheetId, viewKind),
      { status: `Placed ${viewKind} view on sheet`, syncCatalog: false },
    );
  }

  return {
    handleSelectSheetDocument,
    handleRenameSheet,
    handleSetSheetNotes,
    handleAddCombinedSheet,
    handlePlaceView,
  };
}
