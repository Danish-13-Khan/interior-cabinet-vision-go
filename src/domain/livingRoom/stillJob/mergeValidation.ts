import { STILL_JOB_TOLERANCES } from "./tolerances";
import type { StillJobValidation } from "./types";

export function mergeStillValidations(...parts: StillJobValidation[]): StillJobValidation {
  const gates = parts.flatMap((part) => part.gates);
  return {
    ok: gates.every((gate) => gate.pass),
    gates,
    tolerances: STILL_JOB_TOLERANCES,
  };
}
