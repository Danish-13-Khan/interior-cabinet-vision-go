import { useEffect, useState } from "react";
import { MATERIAL_TEXTURE_FALLBACK_EVENT } from "../../domain/livingRoom/materialTextureFeedback";

/** Explains silent solid-colour fallback when a curated texture fails to load. */
export function MaterialTextureLoadBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onFallback() {
      setVisible(true);
    }
    window.addEventListener(MATERIAL_TEXTURE_FALLBACK_EVENT, onFallback);
    return () => window.removeEventListener(MATERIAL_TEXTURE_FALLBACK_EVENT, onFallback);
  }, []);

  if (!visible) return null;

  return (
    <div className="lr-texture-fallback-banner" role="status" data-testid="material-texture-fallback">
      <p>Texture failed to load — showing a solid colour instead.</p>
      <button type="button" onClick={() => setVisible(false)}>Dismiss</button>
    </div>
  );
}
