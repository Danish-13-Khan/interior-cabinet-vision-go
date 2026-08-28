const MODEL_GUIDE_STORAGE_KEY = "cabinet-designer:3d-guide:j1";

function browserStorage(): Storage | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function shouldShowModelGuide(): boolean {
  try {
    return browserStorage()?.getItem(MODEL_GUIDE_STORAGE_KEY) !== "dismissed";
  } catch {
    return true;
  }
}

export function persistModelGuideDismissal(): void {
  try {
    browserStorage()?.setItem(MODEL_GUIDE_STORAGE_KEY, "dismissed");
  } catch {
    // A blocked preference store must never prevent the 3D room from rendering.
  }
}
