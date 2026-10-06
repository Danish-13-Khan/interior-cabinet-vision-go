export type CardCameraPathId = "hero" | "overview" | "overview-to-hero" | "room-arc";

export interface CardCaptureHook {
  ready(): Promise<void>;
  paths(): CardCameraPathId[];
  pose(path: CardCameraPathId, t: number): Promise<void>;
  setLook(look: { quality: "presentation"; mood: "day" | "evening" }): Promise<void>;
}

declare global {
  interface Window {
    __cardCapture?: CardCaptureHook;
  }
}

export {};
