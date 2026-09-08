import type { CSSProperties } from "react";
import { textureRepeatFromUvScaleMm } from "../../rendering/materials/materialScale";
import { normalizeFinishUv, type FinishImportDraft } from "../../domain/livingRoom";

/** CSS layer style that mirrors compiled UV scale / rotation / offset for import preview. */
export function finishImportPreviewLayerStyle(
  draft: Pick<FinishImportDraft, "dataUrl" | "uvScaleMm" | "uvRotationDeg" | "uvOffsetU" | "uvOffsetV">,
): CSSProperties {
  const uv = normalizeFinishUv(draft);
  const repeat = textureRepeatFromUvScaleMm(uv.uvScaleMm);
  return {
    backgroundImage: `url(${draft.dataUrl})`,
    backgroundRepeat: "repeat",
    backgroundSize: `${100 / repeat.x}% ${100 / repeat.y}%`,
    backgroundPosition: `${uv.uvOffsetU * 100}% ${uv.uvOffsetV * 100}%`,
    transform: `rotate(${uv.uvRotationDeg}deg) scale(1.42)`,
    transformOrigin: "center center",
    width: "100%",
    height: "100%",
    minHeight: 140,
  };
}
