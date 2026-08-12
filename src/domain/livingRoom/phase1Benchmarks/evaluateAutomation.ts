import type { Phase1CheckResult } from "./proofTypes";

export const PHASE1_AUTOMATION_GATE_IDS = [
  "qa:assets",
  "qa:render",
  "presets:check",
  "phase1-domain",
  "qa:smoke",
] as const;

export type Phase1AutomationGateId = (typeof PHASE1_AUTOMATION_GATE_IDS)[number];

export type Phase1AutomationGateResult = {
  id: Phase1AutomationGateId;
  pass: boolean;
  detail?: string;
};

export type Phase1AutomationReport = {
  generatedAt: string;
  gates: Phase1AutomationGateResult[];
};

/** Automation passes only when every §3.2 gate is present and green. */
export function evaluateAutomation(
  report: Phase1AutomationReport | undefined,
): Phase1CheckResult {
  if (!report) {
    return {
      id: "automation",
      status: "pending",
      detail:
        "Run `npm run phase1:proof` (qa:assets, qa:render, presets:check, phase1-domain, qa:smoke).",
    };
  }

  const byId = new Map(report.gates.map((gate) => [gate.id, gate]));
  const missing = PHASE1_AUTOMATION_GATE_IDS.filter((id) => !byId.has(id));
  const failed = PHASE1_AUTOMATION_GATE_IDS.filter((id) => byId.get(id)?.pass !== true);

  if (missing.length > 0) {
    return {
      id: "automation",
      status: "fail",
      detail: `Automation report missing gates: ${missing.join(", ")}`,
    };
  }
  if (failed.length > 0) {
    return {
      id: "automation",
      status: "fail",
      detail: `Automation gates failed: ${failed.join(", ")}`,
    };
  }
  return {
    id: "automation",
    status: "pass",
    detail: `All ${PHASE1_AUTOMATION_GATE_IDS.length} automation gates green (${report.generatedAt}).`,
  };
}
