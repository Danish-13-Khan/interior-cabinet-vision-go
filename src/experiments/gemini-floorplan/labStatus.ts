export type LabPhase = "idle" | "ready" | "blocked" | "busy" | "done" | "error";

export type LabStatusModel = {
  phase: LabPhase;
  headline: string;
  detail: string;
};

export function buildLabStatus(input: {
  hasKey: boolean;
  fileName: string | null;
  busy?: boolean;
  hasProposal?: boolean;
  extractError?: string | null;
}): LabStatusModel {
  if (input.busy) {
    return {
      phase: "busy",
      headline: "Running Gemini Vision",
      detail: "Extracting walls and rooms from the floor-plan image…",
    };
  }
  if (input.extractError) {
    return {
      phase: "error",
      headline: "Extract failed",
      detail: input.extractError,
    };
  }
  if (input.hasProposal) {
    return {
      phase: "done",
      headline: "Proposal ready",
      detail: "Validated JSON normalized to mm. Review in the panel (3D is Phase 3).",
    };
  }
  if (!input.hasKey) {
    return {
      phase: "blocked",
      headline: "API key optional for now",
      detail: "Load offline fixtures anytime. Add VITE_GEMINI_API_KEY later to run Vision.",
    };
  }
  if (input.fileName) {
    return {
      phase: "ready",
      headline: "Image selected",
      detail: `${input.fileName} — click Run Gemini Vision.`,
    };
  }
  return {
    phase: "idle",
    headline: "Phase 1 · Vision extract",
    detail: "Upload a floor-plan image, or load an offline fixture JSON.",
  };
}
