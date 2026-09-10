import { useCallback, useState } from "react";

export type DraftingAppearance = "light" | "dark-frame";

const STORAGE_KEY = "cabinet-designer-drafting-appearance";

function readAppearance(): DraftingAppearance {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark-frame" ? "dark-frame" : "light";
}

export function useDraftingAppearance() {
  const [appearance, setAppearanceState] = useState<DraftingAppearance>(readAppearance);
  const setAppearance = useCallback((next: DraftingAppearance) => {
    setAppearanceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);
  return { appearance, setAppearance };
}
