/** Phase 5 — product view-cube face ids (no McCurdy / debug). */
export type ViewCubeFace = "home" | "front" | "side" | "top" | "reset";

/** Matches CabinetScene ViewPreset; kept here to avoid domain→UI imports. */
export type ViewCubePreset = "iso" | "front" | "side" | "top";

export type ViewCubeAction = {
  /** Preset to apply; null means keep current (Reset = fit only). */
  preset: ViewCubePreset | null;
  /** Bump fitVersion / call fitView. */
  fit: boolean;
};

/**
 * Map a view-cube face to camera actions.
 * Home → iso + fit; orthographic faces → that preset + fit; Reset → fit only.
 */
export function resolveViewCubeAction(face: ViewCubeFace): ViewCubeAction {
  switch (face) {
    case "home":
      return { preset: "iso", fit: true };
    case "front":
      return { preset: "front", fit: true };
    case "side":
      return { preset: "side", fit: true };
    case "top":
      return { preset: "top", fit: true };
    case "reset":
      return { preset: null, fit: true };
  }
}
