import type { HardwareItem } from "./types";

/** D10: push values (latch, runner, hinge brand) are industry defaults until Ilyas confirms (Q2, Q3, Q7). */
const unconfirmedDefault = true;

/** Push-to-open hardware (Phase 2). Q2 drawers use `drawer-slide-push`. */
export const PUSH_HARDWARE_ITEMS: readonly HardwareItem[] = [
  {
    id: "push-latch",
    label: "Push latch (per leaf)",
    kind: "accessory",
    costPerUnit: 180,
    description: "Handleless push-to-open latch for doors and drawers",
    unconfirmedDefault,
  },
  {
    id: "tip-on-door",
    label: "Tip-On push opener (per leaf)",
    kind: "accessory",
    costPerUnit: 220,
    description: "Blum Tip-On style mechanical push opener",
    unconfirmedDefault,
  },
  {
    id: "drawer-slide-push",
    label: "Push-to-open undermount slide (pair)",
    kind: "slide",
    costPerUnit: 680,
    softClose: true,
    pair: true,
    lengthMm: 500,
    description: "Push-open runners (Q2 default); drawers need no separate latch",
    unconfirmedDefault,
  },
];
