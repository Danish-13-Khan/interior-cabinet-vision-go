import type { InteriorProject, RenderComposition } from "../domain/interiorProject";
import {
  buildStillJob,
  HERO_STILL_ENGINE,
  HERO_STILL_ENHANCEMENTS,
  mergeStillValidations,
  openStillReview,
  stillSupportArtifactRefs,
  STILL_JOB_TOLERANCES,
  validateStillJobAgainstProject,
  type StillJob,
  type StillJobValidation,
  type StillReviewSession,
} from "../domain/livingRoom";
import type { RenderCaptureHandle } from "../components/livingRoomScene/RenderCaptureBridge";
import { stillDiffOverlayDataUrl } from "../rendering/export/stillDiffOverlay";
import { runHeroStillEngine } from "../rendering/stillEngine/runHeroStillEngine";
import { validateStillEngineRerun } from "../rendering/stillEngine/validateStillRerun";

export type StillGenerationResult = {
  still: string;
  plateDataUrl: string;
  diffDataUrl: string;
  depthDataUrl: string | null;
  validation: StillJobValidation;
  session: StillReviewSession;
};

export async function runStillGeneration(args: {
  project: InteriorProject;
  cameraId: string;
  capture: RenderCaptureHandle;
  widthPx: number;
  heightPx: number;
  composition: RenderComposition;
  transparentBackground: boolean;
}): Promise<StillGenerationResult> {
  const request = {
    cameraId: args.cameraId,
    widthPx: args.widthPx,
    heightPx: args.heightPx,
    transparentBackground: args.transparentBackground,
    composition: args.composition,
  };
  const bundle = args.capture.captureStillBundle
    ? await args.capture.captureStillBundle(request)
    : { heroPng: await args.capture.capturePng(request), depthPng: undefined };
  const still = await runHeroStillEngine({
    plateDataUrl: bundle.heroPng,
    depthDataUrl: bundle.depthPng,
  });
  const stillRerun = await runHeroStillEngine({
    plateDataUrl: bundle.heroPng,
    depthDataUrl: bundle.depthPng,
  });
  const jobId = `sj-${args.cameraId.slice(-8)}-${Date.now().toString(36)}`;
  const attachments = stillSupportArtifactRefs(jobId);
  const job: StillJob = buildStillJob({
    project: args.project,
    cameraId: args.cameraId,
    jobId,
    seed: 0,
    qualityPresetId: "client-preview",
    engine: { id: HERO_STILL_ENGINE.id, version: HERO_STILL_ENGINE.version },
    allowedEnhancements: [...HERO_STILL_ENHANCEMENTS],
    attachments,
  });
  const rerunGate = await validateStillEngineRerun(still, stillRerun);
  const validation = mergeStillValidations(
    validateStillJobAgainstProject(job, args.project),
    { ok: rerunGate.pass, gates: [rerunGate], tolerances: STILL_JOB_TOLERANCES },
  );
  const diffDataUrl = await stillDiffOverlayDataUrl(bundle.heroPng, still);
  return {
    still,
    plateDataUrl: bundle.heroPng,
    diffDataUrl,
    depthDataUrl: bundle.depthPng ?? null,
    validation,
    session: openStillReview(job, attachments.heroPngPath ?? null, `${jobId}-still.png`),
  };
}
