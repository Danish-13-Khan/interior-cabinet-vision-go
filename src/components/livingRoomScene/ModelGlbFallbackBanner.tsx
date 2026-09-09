import { useEffect, useState } from "react";
import { MODEL_GLB_FALLBACK_EVENT } from "../../domain/livingRoom/modelQualityFeedback";

/** Explains silent procedural fallback when a GLB model fails to load. */
export function ModelGlbFallbackBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onFallback() {
      setVisible(true);
    }
    window.addEventListener(MODEL_GLB_FALLBACK_EVENT, onFallback);
    return () => window.removeEventListener(MODEL_GLB_FALLBACK_EVENT, onFallback);
  }, []);

  if (!visible) return null;

  return (
    <div className="lr-texture-fallback-banner lr-model-glb-fallback-banner" role="status" data-testid="model-glb-fallback">
      <p>Model unavailable — showing a simplified placeholder instead.</p>
      <button type="button" onClick={() => setVisible(false)}>Dismiss</button>
    </div>
  );
}
