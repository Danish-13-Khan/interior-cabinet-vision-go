/**
 * Push-to-open defaults while Ilyas Q2–Q3 (and hinge brand) are unanswered
 * (docs/APARTMENT_TEMPLATES_ROADMAP.md §7).
 *
 * Q2 drawers: ship push-open runners (`drawer-slide-push`), not gola-only drawers.
 * Q3 latch buffer: known tip value is 3 mm, but APPLY_PUSH_LATCH_BUFFER stays off
 * until Ilyas confirms brand set-back — cut sizes stay on normal gaps by default.
 * Hinge: soft-close fights mechanical push / Tip-On; schedules use spring-free
 * hinges until Ilyas names the preferred brand (Tip-On Soft-Close vs plain).
 */
export type PushMechanism = "push-latch" | "tip-on";

export const DEFAULT_PUSH_MECHANISM: PushMechanism = "tip-on";

/** Door / drawer edge set-back for the latch plunger (Q3 tip value). */
export const PUSH_LATCH_BUFFER_MM = 3;

/**
 * Opt-in: widen push front side/centre/top/bottom gaps by PUSH_LATCH_BUFFER_MM.
 * Off until Ilyas answers Q3 — do not change cut sizes by default.
 */
export const APPLY_PUSH_LATCH_BUFFER = false;

export const PUSH_MECHANISM_HARDWARE: Record<PushMechanism, string> = {
  "push-latch": "push-latch",
  "tip-on": "tip-on-door",
};

export const PUSH_DRAWER_SLIDE_ID = "drawer-slide-push";

/** Spring-free hinge for push door leaves (soft-close fights the latch). */
export const PUSH_DOOR_HINGE_ID = "hinge-spring-free";

export const PUSH_MECHANISM_PARAMETER = "pushMechanism";
