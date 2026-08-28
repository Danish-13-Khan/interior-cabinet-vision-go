import type { RenderQuality } from "../../interiorProject";
import { describePresetHonesty } from "../presetHonesty";
import { resolveStudioRenderMode } from "../renderPresets";
import { describeStillHonesty } from "../stillHonesty";
import { tierIdForRenderQuality } from "./tierForQuality";
import type { RenderHonestyDescription, RenderStudioView } from "./types";

/** Context-aware honesty for Render Studio chrome and result captions. */
export function resolveRenderStudioHonesty(input: {
  view: RenderStudioView;
  quality: RenderQuality;
  resultQuality?: RenderQuality | null;
}): RenderHonestyDescription {
  if (input.view === "still") {
    return { ...describeStillHonesty(), tierId: "hybrid-still" };
  }
  const quality = (input.view === "result" || input.view === "compare") && input.resultQuality
    ? input.resultQuality
    : input.quality;
  const mode = resolveStudioRenderMode(quality);
  return {
    ...describePresetHonesty(quality, mode),
    tierId: tierIdForRenderQuality(quality),
  };
}
