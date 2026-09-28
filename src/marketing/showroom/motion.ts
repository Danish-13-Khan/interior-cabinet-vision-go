/** Showroom timeline: pure time → pose math so the choreography is testable. */
export const TIMELINE_SECONDS = 8;
export const HOLD_SECONDS = 3;
export const CYCLE_SECONDS = TIMELINE_SECONDS + HOLD_SECONDS;
export const PART_SECONDS = 0.9;
export const DRAWER_CUE = 6.3;
export const DRAWER_SECONDS = 0.8;
export const DRAWER_TRAVEL = 0.4;
export const ORBIT_DEGREES = 20;

export type TimelineStage = 'empty' | 'carcasses' | 'fronts' | 'countertop' | 'drawer' | 'hold';

export const STAGE_CUES: readonly { stage: TimelineStage; at: number }[] = [
  { stage: 'empty', at: 0 },
  { stage: 'carcasses', at: 0.6 },
  { stage: 'fronts', at: 3.4 },
  { stage: 'countertop', at: 4.9 },
  { stage: 'drawer', at: DRAWER_CUE },
  { stage: 'hold', at: TIMELINE_SECONDS },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function easeOut(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

export function easeInOut(value: number) {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Map wall-clock seconds onto the loop, or clamp to the finished pose when not looping. */
export function cycleTime(elapsed: number, loop: boolean) {
  const safe = Math.max(0, elapsed);
  return loop ? safe % CYCLE_SECONDS : Math.min(safe, TIMELINE_SECONDS);
}

export function partProgress(seconds: number, cue: number, duration = PART_SECONDS) {
  return easeOut((seconds - cue) / duration);
}

export function drawerOpen(seconds: number) {
  return easeInOut((seconds - DRAWER_CUE) / DRAWER_SECONDS) * DRAWER_TRAVEL;
}

/** Camera azimuth in radians: a slow 20° sweep across the build, then held. */
export function cameraAzimuth(seconds: number) {
  const sweep = easeInOut(seconds / TIMELINE_SECONDS);
  return ((sweep - 0.5) * ORBIT_DEGREES * Math.PI) / 180;
}

export function timelineStage(seconds: number): TimelineStage {
  let current: TimelineStage = 'empty';
  for (const cue of STAGE_CUES) if (seconds >= cue.at) current = cue.stage;
  return current;
}

export const STAGE_LABELS: Record<TimelineStage, string> = {
  empty: 'Measuring the room…',
  carcasses: 'Placing cabinet boxes…',
  fronts: 'Fitting doors and drawer fronts…',
  countertop: 'Adding the worktop…',
  drawer: 'Checking drawer clearance…',
  hold: 'Buildable run · drag to orbit',
};
