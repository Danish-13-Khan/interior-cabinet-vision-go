import { useMemo } from "react";
import type { RenderQuality } from "../domain/interiorProject";
import {
  resolveRenderStudioHonesty,
  type LivingRoomRenderResult,
  type RenderStudioView,
} from "../domain/livingRoom";

export function useRenderStudioHonesty(
  view: RenderStudioView,
  quality: RenderQuality,
  latestResult: LivingRoomRenderResult | null,
) {
  return useMemo(
    () => resolveRenderStudioHonesty({
      view,
      quality,
      resultQuality: latestResult?.quality ?? null,
    }),
    [view, quality, latestResult?.quality],
  );
}
