import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { InteriorProject, RenderComposition } from "../domain/interiorProject";
import {
  acceptStillReview,
  createIdleStillReview,
  rejectStillReview,
  retryStillReview,
  type StillJobValidation,
  type StillReviewSession,
} from "../domain/livingRoom";
import type { RenderCaptureHandle } from "../components/livingRoomScene/RenderCaptureBridge";
import { runStillGeneration } from "./runStillGeneration";
import {
  selectPackageAcceptedStillAssets,
  type AcceptedStillAsset,
} from "./selectPackageAcceptedStillAssets";

export type StillReviewCompareMode = "split" | "plate" | "still" | "overlay" | "diff";

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
  acceptedStillAssets?: AcceptedStillAsset[];
  onAcceptedStillAssetsChange?: Dispatch<SetStateAction<AcceptedStillAsset[]>>;
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
  const [localAcceptedStills, setLocalAcceptedStills] = useState<AcceptedStillAsset[]>([]);
  const acceptedStillAssets = args.acceptedStillAssets ?? localAcceptedStills;
  const setAcceptedStillAssets = args.onAcceptedStillAssetsChange ?? setLocalAcceptedStills;
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
      const result = await runStillGeneration({
        project,
        cameraId,
        capture: liveCapture,
        widthPx,
        heightPx,
        composition,
        transparentBackground,
      });
      stillDataUrlRef.current = result.still;
      setPlateDataUrl(result.plateDataUrl);
      setStillDataUrl(result.still);
      setDiffDataUrl(result.diffDataUrl);
      setDepthDataUrl(result.depthDataUrl);
      setValidation(result.validation);
      setSession(result.session);
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
        setAcceptedStillAssets((items) => [
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
        setAcceptedStillAssets((items) => items.filter((item) => item.provenance.cameraId !== camera));
      }
      return next;
    });
  }, []);

  const retry = useCallback(async () => {
    setSession((current) => (current.job ? retryStillReview(current) : current));
    await generateStill();
  }, [generateStill]);

  const packageAcceptedStills = useMemo(
    () => selectPackageAcceptedStillAssets(project, acceptedStillAssets),
    [acceptedStillAssets, project],
  );

  const packageReady = packageAcceptedStills.length > 0;

  return {
    session,
    plateDataUrl,
    stillDataUrl,
    diffDataUrl,
    depthDataUrl,
    validation,
    acceptedStills: packageAcceptedStills,
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
