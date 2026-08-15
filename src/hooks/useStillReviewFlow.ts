import { useCallback, useMemo, useRef, useState } from "react";
import type { InteriorProject, RenderComposition } from "../domain/interiorProject";
import {
  acceptStillReview,
  buildStillJob,
  createIdleStillReview,
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
import { gradeHeroPlate } from "../rendering/export/stillPlateGrade";

export type StillReviewCompareMode = "plate" | "still" | "overlay" | "diff";

export function useStillReviewFlow(args: {
  project: InteriorProject;
  cameraId: string | undefined;
  capture: RenderCaptureHandle | null;
  widthPx: number;
  heightPx: number;
  composition: RenderComposition;
  transparentBackground: boolean;
}) {
  const {
    project,
    cameraId,
    capture,
    widthPx,
    heightPx,
    composition,
    transparentBackground,
  } = args;
  const busyRef = useRef(false);
  const [session, setSession] = useState<StillReviewSession>(createIdleStillReview);
  const [plateDataUrl, setPlateDataUrl] = useState<string | null>(null);
  const [stillDataUrl, setStillDataUrl] = useState<string | null>(null);
  const [diffDataUrl, setDiffDataUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<StillJobValidation | null>(null);
  const [acceptedStills, setAcceptedStills] = useState<StillProvenance[]>([]);
  const [compareMode, setCompareMode] = useState<StillReviewCompareMode>("overlay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStill = useCallback(async () => {
    if (!capture || !cameraId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const plate = await capture.capturePng({
        cameraId,
        widthPx,
        heightPx,
        transparentBackground,
        composition,
      });
      const still = await gradeHeroPlate(plate);
      const jobId = `sj-${cameraId.slice(-8)}-${Date.now().toString(36)}`;
      const attachments = stillSupportArtifactRefs(jobId);
      const job = buildStillJob({
        project,
        cameraId,
        jobId,
        seed: 0,
        engine: { id: "stilljob-handoff", version: "0.2.0" },
        attachments,
      });
      const nextValidation = validateStillJobAgainstProject(job, project);
      const diff = await stillDiffOverlayDataUrl(plate, still);
      setPlateDataUrl(plate);
      setStillDataUrl(still);
      setDiffDataUrl(diff);
      setValidation(nextValidation);
      setSession(openStillReview(job, attachments.heroPngPath ?? null, `${jobId}-still.png`));
      setCompareMode("overlay");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Still generation failed.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [cameraId, capture, composition, heightPx, project, transparentBackground, widthPx]);

  const accept = useCallback(() => {
    setSession((current) => {
      if (current.status !== "pending_review") return current;
      const next = acceptStillReview(current, new Date().toISOString());
      const provenance = next.provenance;
      if (provenance) {
        setAcceptedStills((items) => [
          ...items.filter((item) => item.cameraId !== provenance.cameraId),
          provenance,
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
        setAcceptedStills((items) => items.filter((item) => item.cameraId !== camera));
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
