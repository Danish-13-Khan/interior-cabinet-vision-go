import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtractionResult } from "../domain/floorplanExtract";
import {
  acquireFloorplanGlbObjectUrl,
  getFloorplanGlb,
  releaseFloorplanGlbObjectUrl,
} from "../domain/floorplanExtract";
import { clearFloorplanPreviewGltf } from "../rendering/floorplanPreviewGltf";

export type FloorplanGlbPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; fingerprint: string; objectUrl: string }
  | { status: "error"; message: string };

/**
 * Loads sidecar GLB via P0a cache and holds one object-URL lease while enabled.
 * `draftKey` is the content signal; `draft` is read from a ref so object identity
 * churn from normalize/project does not refetch.
 */
export function useFloorplanGlbPreview(
  draft: ExtractionResult | null,
  enabled: boolean,
  draftKey: string,
): FloorplanGlbPreviewState & { retry: () => void } {
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<FloorplanGlbPreviewState>({ status: "idle" });
  const retry = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const current = draftRef.current;
    if (!enabled || !current) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    let fingerprint: string | null = null;
    let objectUrl: string | null = null;
    const ac = new AbortController();
    setState({ status: "loading" });

    void (async () => {
      try {
        const handle = await getFloorplanGlb(current, { signal: ac.signal });
        if (cancelled) return;
        fingerprint = handle.fingerprint;
        objectUrl = acquireFloorplanGlbObjectUrl(handle.fingerprint);
        if (cancelled) {
          clearFloorplanPreviewGltf(objectUrl);
          releaseFloorplanGlbObjectUrl(fingerprint);
          fingerprint = null;
          objectUrl = null;
          return;
        }
        setState({ status: "ready", fingerprint, objectUrl });
      } catch (error) {
        if (cancelled || ac.signal.aborted) return;
        const message = error instanceof Error ? error.message : "GLB preview failed.";
        setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      if (fingerprint && objectUrl) {
        clearFloorplanPreviewGltf(objectUrl);
        releaseFloorplanGlbObjectUrl(fingerprint);
      }
    };
  }, [enabled, draftKey, tick]);

  return { ...state, retry };
}
