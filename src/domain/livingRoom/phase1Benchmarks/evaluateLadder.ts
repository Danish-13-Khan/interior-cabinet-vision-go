import { resolveEnvironmentLightingQuality } from "../environmentLightingQuality";
import { resolveGroundingQuality } from "../groundingQuality";
import { resolveMaterialContrast } from "../materialContrast";
import { compileLivingRoomScene } from "../sceneCompiler";
import { resolveRenderCameraPose } from "../renderCameraPose";
import { resolveWindowKeyLights } from "../windowKeyLight";
import { listPhase1BenchmarkFrames } from "./buildBenchmarks";
import type { Phase1BenchmarkFrameId } from "./types";
import type { Phase1CheckResult, Phase1FrameLadderReport } from "./proofTypes";

export function ladderDifferences(frameId: Phase1BenchmarkFrameId): Phase1FrameLadderReport {
  const frame = listPhase1BenchmarkFrames().find((item) => item.frameId === frameId);
  if (!frame) return { frameId, differences: [], pass: false };

  const scene = compileLivingRoomScene(frame.project);
  const camera = frame.project.cameras.find((item) => item.id === frame.cameraId)!;
  const draftLight = resolveWindowKeyLights({
    openings: scene.windowOpenings,
    roomCenterMm: scene.bounds.center,
    recipeId: scene.lightingRecipeId,
    mode: "preview",
    quality: "draft",
  });
  const clientLight = resolveWindowKeyLights({
    openings: scene.windowOpenings,
    roomCenterMm: scene.bounds.center,
    recipeId: scene.lightingRecipeId,
    mode: "hero",
    quality: "client-preview",
  });
  const draftGround = resolveGroundingQuality("preview", "draft");
  const clientGround = resolveGroundingQuality("hero", "client-preview");
  const draftMat = resolveMaterialContrast("wood", "preview", "draft");
  const clientMat = resolveMaterialContrast("wood", "hero", "client-preview");
  const draftPose = resolveRenderCameraPose(camera, scene.bounds, "architectural", "preview");
  const clientPose = resolveRenderCameraPose(camera, scene.bounds, "architectural", "hero");
  const draftEnv = resolveEnvironmentLightingQuality("preview", "draft");
  const clientEnv = resolveEnvironmentLightingQuality("hero", "client-preview");

  const differences: string[] = [];
  if ((clientLight[0]?.intensity ?? 0) > (draftLight[0]?.intensity ?? 0) + 0.05) {
    differences.push("key-light-contrast");
  }
  if (clientGround.opacityScale > draftGround.opacityScale
    && clientGround.resolution > draftGround.resolution) {
    differences.push("contact-grounding");
  }
  if (clientMat.envBoost > draftMat.envBoost
    && clientMat.clearcoatBoost > draftMat.clearcoatBoost) {
    differences.push("material-punch");
  }
  if (
    clientPose.position.y !== draftPose.position.y
    || clientPose.fieldOfViewDegrees !== draftPose.fieldOfViewDegrees
    || clientEnv.intensityScale > draftEnv.intensityScale
  ) {
    differences.push("exposure-framing");
  }
  return { frameId, differences, pass: differences.length >= 3 };
}

export function evaluateLadder(): Phase1CheckResult {
  const reports = listPhase1BenchmarkFrames().map((frame) => ladderDifferences(frame.frameId));
  const failed = reports.filter((report) => !report.pass);
  return {
    id: "ladder",
    status: failed.length === 0 ? "pass" : "fail",
    detail: failed.length === 0
      ? `All ${reports.length} frames differ on ≥3 Draft vs Client Preview axes.`
      : `Frames below ladder threshold: ${failed.map((item) => item.frameId).join(", ")}`,
  };
}
