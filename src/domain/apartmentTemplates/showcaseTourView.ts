import type { RenderComposition } from "../interiorProject";
import type { CabinetRunAudience } from "../livingRoom/cabinetRunFrame";
import type { LightingMood } from "../livingRoom/lightingMood";

/** How Model View is being shown: authoring, touring, presenting to a client, or touring inside Present. */
export type ShowcaseViewMode = { touring: boolean; presentation: boolean };

/** The view-only Day/Evening toggle is offered while touring or presenting. */
export function showcaseMoodOffered(mode: ShowcaseViewMode): boolean {
  return mode.touring || mode.presentation;
}

/**
 * The view-only mood applies only while its toggle is offered: once the tour
 * ends outside Present, or Present is left, the saved mood is back on screen.
 */
export function showcaseMoodOverride(override: LightingMood | null, mode: ShowcaseViewMode): LightingMood | null {
  return showcaseMoodOffered(mode) ? override : null;
}

/**
 * Camera framing: while touring, each showcase camera is shown as authored
 * (no cabinet-run framing, no architectural re-frame); otherwise Present frames
 * the run for the client and authoring frames it for the designer.
 */
export function showcaseCameraFraming(mode: ShowcaseViewMode): {
  frameRun?: CabinetRunAudience;
  composition?: RenderComposition;
} {
  return mode.touring ? { composition: "project-camera" } : { frameRun: mode.presentation ? "client" : "author" };
}
