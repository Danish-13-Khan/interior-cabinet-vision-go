import { useCallback, useState } from "react";
import {
  loadWorkshopLibrary,
  saveWorkshopLibrary,
  type WorkshopLibraryPack,
} from "../domain/workshopLibrary";

export function useWorkshopLibrary() {
  const [library, setLibrary] = useState<WorkshopLibraryPack>(() =>
    loadWorkshopLibrary(),
  );

  const updateLibrary = useCallback((next: WorkshopLibraryPack) => {
    setLibrary(next);
    saveWorkshopLibrary(next);
  }, []);

  return {
    library,
    setLibrary: updateLibrary,
    replaceLibrary: updateLibrary,
  };
}
