import type { RenderComposition } from "../interiorProject";
import type { CabinetRunAudience } from "../livingRoom/cabinetRunFrame";
import type { LightingMood } from "../livingRoom/lightingMood";

/**
 * How Model View is being shown: authoring, touring, presenting to a client, or
 * touring inside Present. `capture` is a still script driving the view through
 * the card-capture hook; it chooses the mood the still is graded against.
 */
export type ShowcaseViewMode = { touring: boolean; presentation: boolean; capture?: boolean };

/** The view-only Day/Evening toggle is offered while touring, presenting, or capturing stills. */
export function showcaseMoodOffered(mode: ShowcaseViewMode): boolean {
  return mode.touring || mode.presentation || mode.capture === true;
}

/**
 * The view-only mood applies only while its toggle is offered: once the tour
 * ends outside Present, or Present is left, the saved mood is back on screen.
 */
export function showcaseMoodOverride(override: LightingMood | null, mode: ShowcaseViewMode): LightingMood | null {
  return showcaseMoodOffered(mode) ? override : null;
}

/**
 * A camera command from outside the canvas (camera menu pick, Fit Room, F key)
 * takes the camera back like canvas input does: stop the tour first, then run it.
 */
export function stoppingTourFirst<A extends unknown[]>(
  stopTour: () => void,
  command: (...args: A) => void,
): (...args: A) => void {
  return (...args) => {
    stopTour();
    command(...args);
  };
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
