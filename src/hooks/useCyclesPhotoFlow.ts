import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  acceptStillReview,
  createLivingRoomRenderResult,
  type LivingRoomRenderResult,
} from "../domain/livingRoom";
import { proposalExportViews, proposalSceneBinding } from "../domain/livingRoom/proposal";
import { exportCyclesBundleForProject } from "../rendering/stillEngine/cycles/exportCyclesBundle";
import { importCyclesStill, parseCyclesProvenance } from "../rendering/stillEngine/cycles/importCyclesStill";
import { discoverCyclesService, renderBundleOnService, type CyclesServiceJob } from "../platform/cyclesService";
import type { AcceptedStillAsset } from "./selectPackageAcceptedStillAssets";

/**
 * Present-mode photo stills in one go: every selected client view is rendered on the
 * Cycles render service, gated by the StillJob trust contract, accepted, and bound to
 * the proposal as both the latest client view and a package still. Nothing is typed
 * into a console; the service is the configured URL or the one `npm run dev:photo`
 * starts next to the app.
 */
export function useCyclesPhotoFlow(args: {
  project: InteriorProject | null;
  onRenderResult: (result: LivingRoomRenderResult) => void;
  onAcceptedStillAssetsChange: Dispatch<SetStateAction<AcceptedStillAsset[]>>;
}) {
  const { project, onRenderResult, onAcceptedStillAssetsChange } = args;
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let live = true;
    void discoverCyclesService().then((url) => {
      if (live) setServiceUrl(url);
    });
    return () => {
      live = false;
    };
  }, []);

  const renderPhotos = useCallback(async () => {
    if (!project || !serviceUrl || busyRef.current) return;
    const views = proposalExportViews(project);
    if (!views.length) {
      setError("Select at least one client view before rendering.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const binding = proposalSceneBinding(project);
      const settings = project.renderSettings;
      for (const [index, view] of views.entries()) {
        const label = `${view.viewName} (${index + 1}/${views.length})`;
        setStatus(`Sending ${label}…`);
        const bundle = exportCyclesBundleForProject(project, { cameraId: view.cameraId });
        const rendered = await renderBundleOnService(bundle, {
          baseUrl: serviceUrl,
          signal: abort.signal,
          onStatus: (job: CyclesServiceJob) => {
            const last = job.log[job.log.length - 1];
            setStatus(job.status === "queued" ? `Queued ${label}…` : `Rendering ${label}… ${last ?? ""}`.trim());
          },
        });
        setStatus(`Checking ${label}…`);
        const provenance = parseCyclesProvenance(rendered.provenanceText);
        const imported = await importCyclesStill({
          project,
          provenance,
          stillDataUrl: rendered.stillDataUrl,
          capture: null,
          widthPx: settings.widthPx,
          heightPx: settings.heightPx,
          composition: settings.composition,
        });
        if (!imported.validation.ok) {
          const failed = imported.validation.gates.filter((gate) => !gate.pass).map((gate) => gate.detail);
          throw new Error(`${view.viewName}: photo still failed its checks (${failed.join("; ")}).`);
        }
        const accepted = acceptStillReview(imported.session, new Date().toISOString());
        const acceptedProvenance = accepted.provenance;
        if (!acceptedProvenance) throw new Error(`${view.viewName}: the accepted still carries no provenance.`);
        onAcceptedStillAssetsChange((items) => [
          ...items.filter((item) => item.provenance.cameraId !== view.cameraId),
          { provenance: acceptedProvenance, stillDataUrl: imported.still },
        ]);
        const camera = project.cameras.find((item) => item.id === view.cameraId);
        if (camera) {
          onRenderResult(createLivingRoomRenderResult({
            dataUrl: imported.still,
            project,
            sceneFingerprint: binding.sceneFingerprint,
            camera,
          }));
        }
      }
      setStatus(`${views.length === 1 ? "Photo still" : `${views.length} photo stills`} ready for the proposal.`);
    } catch (caught) {
      setStatus(null);
      setError(caught instanceof Error ? caught.message : "Photo render failed.");
    } finally {
      abortRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  }, [onAcceptedStillAssetsChange, onRenderResult, project, serviceUrl]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { serviceUrl, busy, status, error, renderPhotos, cancel };
}
