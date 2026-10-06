import type { StillSurfaceReading } from "../livingRoom/stillSurfaceClass";

export type CardCameraPathId = "hero" | "overview" | "overview-to-hero" | "room-arc";

export type StillCaptureLook = {
  quality: "client-preview";
  mood: "day" | "evening";
};

export interface CardCaptureHook {
  ready(): Promise<void>;
  paths(): CardCameraPathId[];
  /** `scene` forces the overview or room scene (overview-to-hero cross-fades); default follows `t`. */
  pose(path: CardCameraPathId, t: number, options?: { scene?: "overview" | "room" }): Promise<void>;
  /** Explicit still preset. Does not inherit the seeded project's quality. */
  setLook(look: StillCaptureLook): Promise<void>;
  /** Wall, floor, and darker-half door pixels from the settled frame. */
  readSurfaces(): Promise<StillSurfaceReading>;
}

declare global {
  interface Window {
    __cardCapture?: CardCaptureHook;
    __stillSurfaceProbe?: () => StillSurfaceReading;
  }
}

export {};
