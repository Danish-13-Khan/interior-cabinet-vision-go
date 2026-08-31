import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../../interiorProject";
import { resolveGroundingQuality } from "../groundingQuality";
import { compileLivingRoomScene } from "../sceneCompiler";
import { resolveRenderCameraPose } from "../renderCameraPose";
import { validateCameraFraming } from "../renderQa";
import { resolveWindowKeyLights } from "../windowKeyLight";
import {
  createPhase1BenchmarkProject,
  listPhase1BenchmarkFrames,
} from "./buildBenchmarks";
import {
  PHASE1_BENCHMARK_IDS,
  PHASE1_BENCHMARK_NOW,
} from "./definitions";
import type { Phase1CheckResult } from "./proofTypes";

export { evaluateAutomation } from "./evaluateAutomation";
export { evaluateHonesty } from "./evaluateHonesty";
export { evaluateLatency } from "./evaluateLatency";

export function evaluateGrounding(): Phase1CheckResult {
  const draft = resolveGroundingQuality("preview", "draft");
  const client = resolveGroundingQuality("hero", "client-preview");
  const ok = client.opacityScale > draft.opacityScale
    && client.resolution >= 512
    && client.farMeters > draft.farMeters;
  return {
    id: "grounding",
    status: ok ? "pass" : "fail",
    detail: ok
      ? `Client Preview contact opacity ${client.opacityScale.toFixed(2)} / res ${client.resolution} / far ${client.farMeters}m`
      : "Client Preview grounding is not stronger than Draft.",
  };
}

export function evaluateWindowKey(): Phase1CheckResult {
  const failures: string[] = [];
  for (const id of PHASE1_BENCHMARK_IDS) {
    const project = createPhase1BenchmarkProject(id);
    const scene = compileLivingRoomScene(project);
    if (scene.windowOpenings.length === 0) continue;
    const draft = resolveWindowKeyLights({
      openings: scene.windowOpenings,
      roomCenterMm: scene.bounds.center,
      recipeId: scene.lightingRecipeId,
      mode: "preview",
      quality: "draft",
    });
    const client = resolveWindowKeyLights({
      openings: scene.windowOpenings,
      roomCenterMm: scene.bounds.center,
      recipeId: scene.lightingRecipeId,
      mode: "hero",
      quality: "client-preview",
    });
    if (!client[0] || (draft[0] && client[0].intensity <= draft[0].intensity)) {
      failures.push(`${id}:key-intensity`);
    }
    if (!client[0]?.castShadow) failures.push(`${id}:cast-shadow`);
  }
  return {
    id: "window-key",
    status: failures.length === 0 ? "pass" : "fail",
    detail: failures.length === 0
      ? "Windowed benchmarks emit a stronger shadowed Client Preview key."
      : `Window key failures: ${failures.join(", ")}`,
  };
}

export function evaluateFraming(): Phase1CheckResult {
  const failures: string[] = [];
  for (const frame of listPhase1BenchmarkFrames()) {
    const scene = compileLivingRoomScene(frame.project);
    const camera = frame.project.cameras.find((item) => item.id === frame.cameraId)!;
    const posed = resolveRenderCameraPose(camera, scene.bounds, "architectural", "hero");
    const report = validateCameraFraming(posed, scene.bounds);
    const blocked = report.issues.filter((issue) =>
      issue.code === "ceiling-heavy" || issue.code === "cut-feet" || issue.severity === "error"
    );
    if (blocked.length > 0) {
      failures.push(`${frame.frameId}:${blocked.map((issue) => issue.code).join("+")}`);
    }
  }
  return {
    id: "framing",
    status: failures.length === 0 ? "pass" : "fail",
    detail: failures.length === 0
      ? "All 6 hero frames pass eye-level framing QA (no ceiling-heavy / cut-feet)."
      : `Framing failures: ${failures.join(", ")}`,
  };
}

export function evaluateDataSafety(): Phase1CheckResult {
  const failures: string[] = [];
  for (const id of PHASE1_BENCHMARK_IDS) {
    const project = createPhase1BenchmarkProject(id);
    const serialized = serializeInteriorProjectFile(project, PHASE1_BENCHMARK_NOW);
    if (/WebGL|file:\/\/|\.glb\b|THREE\.|from ['"]three['"]/i.test(serialized)) {
      failures.push(`${id}:unsafe-payload`);
    }
    try {
      const loaded = loadInteriorProjectFile(serialized);
      if (loaded.document.schemaVersion !== project.schemaVersion) failures.push(`${id}:schema`);
    } catch {
      failures.push(`${id}:load`);
    }
  }
  return {
    id: "data-safety",
    status: failures.length === 0 ? "pass" : "fail",
    detail: failures.length === 0
      ? "Benchmark projects serialize/load without Three/path payloads."
      : `Data safety failures: ${failures.join(", ")}`,
  };
}
