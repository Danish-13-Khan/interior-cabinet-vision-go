import { listPhase1BenchmarkFrames } from "./buildBenchmarks";

/** Expected latency sample slots: 6 frames × draft + client-preview. */
export function expectedPhase1LatencySlots() {
  return listPhase1BenchmarkFrames().flatMap((frame) => [
    { frameId: frame.frameId, quality: "draft" as const },
    { frameId: frame.frameId, quality: "client-preview" as const },
  ]);
}

export function buildLatencySamplesTemplate(machine = "") {
  return {
    appSurface: "tauri-desktop" as const,
    substituteReason: "",
    machine: machine || "Apple Silicon · macOS · ≥16 GB · plugged in (fill chip)",
    samples: expectedPhase1LatencySlots().map((slot) => ({
      ...slot,
      elapsedMs: null as number | null,
    })),
  };
}
