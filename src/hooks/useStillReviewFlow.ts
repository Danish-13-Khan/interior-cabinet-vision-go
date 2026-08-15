import { useCallback, useMemo, useRef, useState } from "react";
import type { InteriorProject, RenderComposition } from "../domain/interiorProject";
import {
  acceptStillReview,
  buildStillJob,
  createIdleStillReview,
  HERO_STILL_ENGINE,
  HERO_STILL_ENHANCEMENTS,
  openStillReview,
  rejectStillReview,
  retryStillReview,
  stillEligibleForPackage,
  stillSupportArtifactRefs,
  validateStillJobAgainstProject,
  type StillJobValidation,
  type StillProvenance,
  type StillReviewSession,
} from "../domain/livingRoom";
import type { RenderCaptureHandle } from "../components/livingRoomScene/RenderCaptureBridge";
import { stillDiffOverlayDataUrl } from "../rendering/export/stillDiffOverlay";
import { runHeroStillEngine } from "../rendering/stillEngine/runHeroStillEngine";

export type StillReviewCompareMode = "split" | "plate" | "still" | "overlay" | "diff";

export type AcceptedStillAsset = {
  provenance: StillProvenance;
  stillDataUrl: string;
};

export function useStillReviewFlow(args: {
  project: InteriorProject;
  cameraId: string | undefined;
  capture: RenderCaptureHandle | null;
  widthPx: number;
  heightPx: number;
  composition: RenderComposition;
  transparentBackground: boolean;
  beforeCapture?: () => Promise<void>;
  afterCapture?: () => void;
}) {
  const {
    project,
    cameraId,
    capture,
    widthPx,
    heightPx,
    composition,
    transparentBackground,
    beforeCapture,
    afterCapture,
  } = args;
  const busyRef = useRef(false);
  const captureRef = useRef(capture);
  captureRef.current = capture;
  const stillDataUrlRef = useRef<string | null>(null);
  const [session, setSession] = useState<StillReviewSession>(createIdleStillReview);
  const [plateDataUrl, setPlateDataUrl] = useState<string | null>(null);
  const [stillDataUrl, setStillDataUrl] = useState<string | null>(null);
  const [diffDataUrl, setDiffDataUrl] = useState<string | null>(null);
  const [depthDataUrl, setDepthDataUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<StillJobValidation | null>(null);
  const [acceptedStills, setAcceptedStills] = useState<AcceptedStillAsset[]>([]);
  const [compareMode, setCompareMode] = useState<StillReviewCompareMode>("split");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStill = useCallback(async () => {
    if (!cameraId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await beforeCapture?.();
      const liveCapture = captureRef.current;
      if (!liveCapture) throw new Error("Render capture is not ready.");
      const request = {
        cameraId,
        widthPx,
        heightPx,
        transparentBackground,
        composition,
      };
      const bundle = liveCapture.captureStillBundle
        ? await liveCapture.captureStillBundle(request)
        : { heroPng: await liveCapture.capturePng(request), depthPng: undefined };
      const still = await runHeroStillEngine({
        plateDataUrl: bundle.heroPng,
        depthDataUrl: bundle.depthPng,
      });
      const jobId = `sj-${cameraId.slice(-8)}-${Date.now().toString(36)}`;
      const attachments = stillSupportArtifactRefs(jobId);
      const job = buildStillJob({
        project,
        cameraId,
        jobId,
        seed: 0,
        qualityPresetId: "client-preview",
        engine: { id: HERO_STILL_ENGINE.id, version: HERO_STILL_ENGINE.version },
        allowedEnhancements: [...HERO_STILL_ENHANCEMENTS],
        attachments,
      });
      const nextValidation = validateStillJobAgainstProject(job, project);
      const diff = await stillDiffOverlayDataUrl(bundle.heroPng, still);
      stillDataUrlRef.current = still;
      setPlateDataUrl(bundle.heroPng);
      setStillDataUrl(still);
      setDiffDataUrl(diff);
      setDepthDataUrl(bundle.depthPng ?? null);
      setValidation(nextValidation);
      setSession(openStillReview(job, attachments.heroPngPath ?? null, `${jobId}-still.png`));
      setCompareMode("split");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Still generation failed.");
    } finally {
      afterCapture?.();
      busyRef.current = false;
      setBusy(false);
    }
  }, [
    afterCapture,
    beforeCapture,
    cameraId,
    composition,
    heightPx,
    project,
    transparentBackground,
    widthPx,
  ]);

  const accept = useCallback(() => {
    setSession((current) => {
      if (current.status !== "pending_review") return current;
      const next = acceptStillReview(current, new Date().toISOString());
      const provenance = next.provenance;
      const png = stillDataUrlRef.current;
      if (provenance && png) {
        setAcceptedStills((items) => [
          ...items.filter((item) => item.provenance.cameraId !== provenance.cameraId),
          { provenance, stillDataUrl: png },
        ]);
      }
      return next;
    });
  }, []);

  const reject = useCallback(() => {
    setSession((current) => {
      if (current.status !== "pending_review") return current;
      const next = rejectStillReview(current);
      if (next.job) {
        const camera = next.job.cameraId;
        setAcceptedStills((items) => items.filter((item) => item.provenance.cameraId !== camera));
      }
      return next;
    });
  }, []);

  const retry = useCallback(async () => {
    setSession((current) => (current.job ? retryStillReview(current) : current));
    await generateStill();
  }, [generateStill]);

  const packageReady = useMemo(
    () => stillEligibleForPackage(session) || acceptedStills.length > 0,
    [acceptedStills.length, session],
  );

  return {
    session,
    plateDataUrl,
    stillDataUrl,
    diffDataUrl,
    depthDataUrl,
    validation,
    acceptedStills,
    compareMode,
    setCompareMode,
    busy,
    error,
    packageReady,
    generateStill,
    accept,
    reject,
    retry,
  };
}
