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
  | { status: "loading"; objectUrl?: string; fingerprint?: string }
  | { status: "ready"; fingerprint: string; objectUrl: string }
  | { status: "error"; message: string; objectUrl?: string; fingerprint?: string };

type Lease = { fingerprint: string; objectUrl: string };

function releaseLease(lease: Lease | null) {
  if (!lease) return;
  clearFloorplanPreviewGltf(lease.objectUrl);
  releaseFloorplanGlbObjectUrl(lease.fingerprint);
}

/**
 * Loads sidecar GLB via P0a cache and holds one object-URL lease while enabled.
 * Refresh keeps the last ready URL until the new lease is ready (no shell flash).
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
  const leaseRef = useRef<Lease | null>(null);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<FloorplanGlbPreviewState>({ status: "idle" });
  const retry = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const current = draftRef.current;
    if (!enabled || !current) {
      releaseLease(leaseRef.current);
      leaseRef.current = null;
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    const ac = new AbortController();
    const prev = leaseRef.current;
    setState(
      prev
        ? { status: "loading", fingerprint: prev.fingerprint, objectUrl: prev.objectUrl }
        : { status: "loading" },
    );

    void (async () => {
      try {
        const handle = await getFloorplanGlb(current, { signal: ac.signal });
        if (cancelled) return;
        const held = leaseRef.current;
        let next: Lease;
        if (held?.fingerprint === handle.fingerprint) {
          next = held;
        } else {
          next = {
            fingerprint: handle.fingerprint,
            objectUrl: acquireFloorplanGlbObjectUrl(handle.fingerprint),
          };
          leaseRef.current = next;
          releaseLease(held);
        }
        setState({ status: "ready", fingerprint: next.fingerprint, objectUrl: next.objectUrl });
      } catch (error) {
        if (cancelled || ac.signal.aborted) return;
        const message = error instanceof Error ? error.message : "GLB preview failed.";
        const keep = leaseRef.current;
        setState(
          keep
            ? { status: "error", message, fingerprint: keep.fingerprint, objectUrl: keep.objectUrl }
            : { status: "error", message },
        );
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      // Keep lease across refresh / draftKey ticks; release only when disabled or unmounted.
    };
  }, [enabled, draftKey, tick]);

  useEffect(() => {
    return () => {
      releaseLease(leaseRef.current);
      leaseRef.current = null;
    };
  }, []);

  return { ...state, retry };
}
