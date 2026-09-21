import type { ViewPreset } from "./types";
import {
  resolveViewCubeAction,
  type ViewCubeFace,
} from "../../domain/orbit/viewCubeActions";

type ViewCubeProps = {
  activePreset: ViewPreset;
  onSetPreset: (preset: ViewPreset) => void;
  onFitView: () => void;
};

function applyFace(
  face: ViewCubeFace,
  onSetPreset: (preset: ViewPreset) => void,
  onFitView: () => void,
) {
  const action = resolveViewCubeAction(face);
  if (action.preset) onSetPreset(action.preset);
  if (action.fit) onFitView();
}

/**
 * Phase 5 — minimalist product view cube (bottom-right of CabinetScene).
 * Always on; separate from Phase 4 `?cameraDebug=1` HUD.
 */
export function ViewCube({ activePreset, onSetPreset, onFitView }: ViewCubeProps) {
  return (
    <div className="view-cube" role="group" aria-label="Camera views">
      <div className="view-cube-body">
        <button
          type="button"
          className={`view-cube-face view-cube-face-top ${activePreset === "top" ? "active" : ""}`}
          title="Top view"
          aria-label="Top view"
          aria-pressed={activePreset === "top"}
          onClick={() => applyFace("top", onSetPreset, onFitView)}
        >
          Top
        </button>
        <button
          type="button"
          className={`view-cube-face view-cube-face-front ${activePreset === "front" ? "active" : ""}`}
          title="Front view"
          aria-label="Front view"
          aria-pressed={activePreset === "front"}
          onClick={() => applyFace("front", onSetPreset, onFitView)}
        >
          Front
        </button>
        <button
          type="button"
          className={`view-cube-face view-cube-face-side ${activePreset === "side" ? "active" : ""}`}
          title="Side view"
          aria-label="Side view"
          aria-pressed={activePreset === "side"}
          onClick={() => applyFace("side", onSetPreset, onFitView)}
        >
          Side
        </button>
        <button
          type="button"
          className={`view-cube-face view-cube-face-home ${activePreset === "iso" ? "active" : ""}`}
          title="Home (iso) view"
          aria-label="Home isometric view"
          aria-pressed={activePreset === "iso"}
          onClick={() => applyFace("home", onSetPreset, onFitView)}
        >
          Home
        </button>
      </div>
      <button
        type="button"
        className="view-cube-reset"
        title="Reset framing"
        aria-label="Reset camera framing"
        onClick={() => applyFace("reset", onSetPreset, onFitView)}
      >
        Reset
      </button>
    </div>
  );
}
