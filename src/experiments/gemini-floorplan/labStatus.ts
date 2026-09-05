export type LabPhase = "idle" | "ready" | "blocked";

export type LabStatusModel = {
  phase: LabPhase;
  headline: string;
  detail: string;
};

export function buildLabStatus(input: {
  hasKey: boolean;
  fileName: string | null;
}): LabStatusModel {
  if (!input.hasKey) {
    return {
      phase: "blocked",
      headline: "API key missing",
      detail: "Add VITE_GEMINI_API_KEY to .env (see .env.example). Vision calls start in Phase 1.",
    };
  }
  if (input.fileName) {
    return {
      phase: "ready",
      headline: "Image selected",
      detail: `${input.fileName} — Vision extract lands in Phase 1.`,
    };
  }
  return {
    phase: "idle",
    headline: "Phase 0 scaffold",
    detail: "Upload a floor-plan image to preview. Gemini Vision is not called yet.",
  };
}
