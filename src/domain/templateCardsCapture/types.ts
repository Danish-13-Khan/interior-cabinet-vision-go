export type CardCameraPathId = "hero" | "overview" | "overview-to-hero" | "room-arc";

export interface CardCaptureHook {
  ready(): Promise<void>;
  paths(): CardCameraPathId[];
  /** `scene` forces the overview or room scene (overview-to-hero cross-fades); default follows `t`. */
  pose(path: CardCameraPathId, t: number, options?: { scene?: "overview" | "room" }): Promise<void>;
  setLook(look: { quality: "presentation"; mood: "day" | "evening" }): Promise<void>;
}

declare global {
  interface Window {
    __cardCapture?: CardCaptureHook;
  }
}

export {};
