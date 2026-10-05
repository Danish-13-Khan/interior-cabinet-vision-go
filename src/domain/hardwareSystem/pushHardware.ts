import type { HardwareItem } from "./types";

/** Push-to-open hardware (Phase 2). Q2 drawers use `drawer-slide-push`. */
export const PUSH_HARDWARE_ITEMS: readonly HardwareItem[] = [
  {
    id: "push-latch",
    label: "Push latch (per leaf)",
    kind: "accessory",
    costPerUnit: 180,
    description: "Handleless push-to-open latch for doors and drawers",
  },
  {
    id: "tip-on-door",
    label: "Tip-On push opener (per leaf)",
    kind: "accessory",
    costPerUnit: 220,
    description: "Blum Tip-On style mechanical push opener",
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
  },
];
