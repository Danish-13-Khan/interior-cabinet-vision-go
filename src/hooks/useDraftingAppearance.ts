import { useCallback, useState } from "react";
import {
  type DraftingAppearance,
  persistDraftingAppearance,
  readDraftingAppearance,
} from "../domain/desktopUx/draftingAppearance";

export type { DraftingAppearance };

export function useDraftingAppearance() {
  const [appearance, setAppearanceState] = useState<DraftingAppearance>(readDraftingAppearance);
  const setAppearance = useCallback((next: DraftingAppearance) => {
    setAppearanceState(next);
    persistDraftingAppearance(next);
  }, []);
  return { appearance, setAppearance };
}
