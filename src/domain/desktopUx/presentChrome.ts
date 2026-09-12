/**
 * Present chrome polish helpers (Phase E).
 * Client strip hides edit tools; journey surfaces stay on existing Present stages.
 */

import type { InteriorsPresentStep } from "./interiorsPresentAndSend";
import { interiorsPresentHint } from "./interiorsPresentAndSend";

export type PresentChromeSurface = {
  titlebar: boolean;
  tray: boolean;
  commercial: boolean;
  actions: boolean;
  editTools: boolean;
  catalogRail: boolean;
  /** Status / blocking callouts */
  status: boolean;
};

export const PRESENT_JOURNEY_STEPS: readonly InteriorsPresentStep[] = [
  "freeze",
  "capture",
  "proposal",
  "approve",
  "send",
  "done",
] as const;

export const PRESENT_JOURNEY_LABELS: Record<InteriorsPresentStep, string> = {
  freeze: "Freeze",
  capture: "Capture",
  proposal: "Proposal",
  approve: "Approve",
  send: "Send",
  done: "Done",
};

/** Surfaces visible for a Present step (client chrome, not shop ribbon). */
export function presentChromeForStep(step: InteriorsPresentStep): PresentChromeSurface {
  const base: PresentChromeSurface = {
    titlebar: true,
    tray: true,
    commercial: true,
    actions: true,
    editTools: false,
    catalogRail: false,
    status: true,
  };
  if (step === "done") {
    return { ...base, actions: false };
  }
  if (step === "capture") {
    return { ...base, commercial: false };
  }
  return base;
}

export function presentChromeStripsEditTools(presenting: boolean): boolean {
  return presenting;
}

export function presentJourneyIndex(step: InteriorsPresentStep): number {
  return PRESENT_JOURNEY_STEPS.indexOf(step);
}

export function presentJourneyProgress(step: InteriorsPresentStep): {
  index: number;
  total: number;
  label: string;
  hint: string;
} {
  const index = Math.max(0, presentJourneyIndex(step));
  return {
    index,
    total: PRESENT_JOURNEY_STEPS.length,
    label: PRESENT_JOURNEY_LABELS[step],
    hint: interiorsPresentHint(step),
  };
}

export function presentClientViewCaption(input: {
  unit: string;
  step: InteriorsPresentStep;
}): string {
  return `Client 3D · Units: ${input.unit} · ${PRESENT_JOURNEY_LABELS[input.step]}`;
}
