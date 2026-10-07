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
import { exportCyclesBundleForProject } from "../rendering/stillEngine/cycles/exportCyclesBundle";
import { importCyclesStill as importCyclesStillFiles, parseCyclesProvenance } from "../rendering/stillEngine/cycles/importCyclesStill";
import { pickCyclesStillFiles, saveCyclesBundle } from "../platform/cyclesFiles";
import { cyclesServiceUrl, renderBundleOnService, type CyclesServiceJob } from "../platform/cyclesService";
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
  /** The hero lock remounts the live canvas; wait for its capture handle to come back. */
  const awaitCapture = useCallback(async (): Promise<RenderCaptureHandle> => {
    const started = Date.now();
    while (Date.now() - started < 6000) {
      const live = captureRef.current;
      if (live) return live;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Render capture is not ready.");
  }, []);
  const [session, setSession] = useState<StillReviewSession>(createIdleStillReview);
  const [plateDataUrl, setPlateDataUrl] = useState<string | null>(null);
  const [stillDataUrl, setStillDataUrl] = useState<string | null>(null);
  const [diffDataUrl, setDiffDataUrl] = useState<string | null>(null);
  const [depthDataUrl, setDepthDataUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<StillJobValidation | null>(null);
  const [compareMode, setCompareMode] = useState<StillReviewCompareMode>("split");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Progress line while the render service works; null when idle. */
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const serviceAbortRef = useRef<AbortController | null>(null);

  const generateStill = useCallback(async () => {
    if (!cameraId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await beforeCapture?.();
      const liveCapture = await awaitCapture();
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
    awaitCapture,
    beforeCapture,
    cameraId,
    composition,
    heightPx,
    project,
    transparentBackground,
    widthPx,
  ]);

  /** Transport (b): write the Cycles job for `npm run cycles:render`. The project is not changed. */
  const exportCyclesJob = useCallback(async () => {
    if (!cameraId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const bundle = exportCyclesBundleForProject(project, { cameraId, widthPx, heightPx });
      const path = await saveCyclesBundle(bundle);
      if (path) setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export the Cycles job.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [cameraId, heightPx, project, widthPx]);

  /** Every Cycles still, picked or fetched, enters review the same way: gates plus a fresh WebGL plate. */
  const applyCyclesFiles = useCallback(async (files: { provenanceText: string; stillDataUrl: string }) => {
    const provenance = parseCyclesProvenance(files.provenanceText);
    await beforeCapture?.();
    try {
      const liveCapture = await awaitCapture();
      const result = await importCyclesStillFiles({
        project,
        provenance,
        stillDataUrl: files.stillDataUrl,
        capture: liveCapture,
        widthPx,
        heightPx,
        composition,
      });
      stillDataUrlRef.current = result.still;
      setPlateDataUrl(result.plateDataUrl);
      setStillDataUrl(result.still);
      setDiffDataUrl(result.diffDataUrl);
      setDepthDataUrl(null);
      setValidation(result.validation);
      setSession(result.session);
      setCompareMode("split");
    } finally {
      afterCapture?.();
    }
  }, [afterCapture, awaitCapture, beforeCapture, composition, heightPx, project, widthPx]);

  /** Bring a rendered still back through the review step from files on disk. */
  const importCyclesStill = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const files = await pickCyclesStillFiles();
      if (files) await applyCyclesFiles(files);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not import the Cycles still.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [applyCyclesFiles]);

  /** Transport (a): post the bundle to the configured render service and import what comes back. */
  const renderCyclesPhoto = useCallback(async () => {
    if (!cameraId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    const abort = new AbortController();
    serviceAbortRef.current = abort;
    try {
      const bundle = exportCyclesBundleForProject(project, { cameraId, widthPx, heightPx });
      setServiceStatus("Sending job…");
      const result = await renderBundleOnService(bundle, {
        signal: abort.signal,
        onStatus: (job: CyclesServiceJob) => {
          const last = job.log[job.log.length - 1];
          setServiceStatus(job.status === "queued" ? "Queued on the render service…" : `Rendering… ${last ?? ""}`.trim());
        },
      });
      setServiceStatus("Importing still…");
      await applyCyclesFiles(result);
      setServiceStatus(null);
    } catch (caught) {
      setServiceStatus(null);
      setError(caught instanceof Error ? caught.message : "Render service failed.");
    } finally {
      serviceAbortRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  }, [applyCyclesFiles, cameraId, heightPx, project, widthPx]);

  const cancelCyclesPhoto = useCallback(() => {
    serviceAbortRef.current?.abort();
  }, []);

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
    exportCyclesJob,
    importCyclesStill,
    renderCyclesPhoto,
    cancelCyclesPhoto,
    serviceStatus,
    serviceConfigured: cyclesServiceUrl() !== null,
    accept,
    reject,
    retry,
  };
}
