/**
 * Push-to-open defaults while Ilyas Q2–Q3 are unanswered
 * (docs/APARTMENT_TEMPLATES_ROADMAP.md §7).
 *
 * Q2 drawers: ship push-open runners (`drawer-slide-push`), not gola-only drawers.
 * Q3 latch buffer: 3 mm set-back on every front edge (Tip-On / push-latch clearance).
 */
export type PushMechanism = "push-latch" | "tip-on";

export const DEFAULT_PUSH_MECHANISM: PushMechanism = "tip-on";

/** Door / drawer edge set-back for the latch plunger (Q3 default). */
export const PUSH_LATCH_BUFFER_MM = 3;

export const PUSH_MECHANISM_HARDWARE: Record<PushMechanism, string> = {
  "push-latch": "push-latch",
  "tip-on": "tip-on-door",
};

export const PUSH_DRAWER_SLIDE_ID = "drawer-slide-push";

export const PUSH_MECHANISM_PARAMETER = "pushMechanism";
