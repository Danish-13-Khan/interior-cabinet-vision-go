import { useCallback, useEffect, useRef, useState } from "react";
import { flushDraftNow, setDraftWritesSuspended } from "../domain/projectDrafts/browserSignals";
import { PROJECT_LOCK_CHANNEL, projectLockName, reduceTabLock, type TabLockState } from "../domain/projectDrafts/projectLock";

export function useProjectTabLock(projectId: string | null) {
  const [state, setState] = useState<TabLockState>("free");
  const [attempt, setAttempt] = useState(0);
  const releaseRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    let cancelled = false;
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(PROJECT_LOCK_CHANNEL);
    const onMessage = (event: MessageEvent<{ type?: string; projectId?: string }>) => {
      const data = event.data;
      if (!data || data.projectId !== projectId) return;
      if (data.type === "ping") channel?.postMessage({ type: "pong", projectId });
      if (data.type === "pong") setState((current) => reduceTabLock(current, { type: "peer-alive" }));
      if (data.type === "takeover" && stateRef.current === "held") {
        void (async () => {
          await flushDraftNow();
          releaseRef.current?.();
          releaseRef.current = null;
          setDraftWritesSuspended(true);
          setState("taken-over");
          channel?.postMessage({ type: "released", projectId });
        })();
      }
    };
    channel?.addEventListener("message", onMessage);
    const locks = navigator.locks;
    if (locks?.request) {
      void locks.request(projectLockName(projectId), { mode: "exclusive", ifAvailable: true }, (lock) => {
        if (cancelled) return undefined;
        if (!lock) { setState((current) => reduceTabLock(current, { type: "denied" })); return undefined; }
        setDraftWritesSuspended(false);
        setState("held");
        return new Promise<void>((release) => { releaseRef.current = release; });
      });
    } else {
      channel?.postMessage({ type: "ping", projectId });
      const timer = window.setTimeout(() => {
        if (!cancelled && stateRef.current === "free") setState("held");
      }, 350);
      return () => { cancelled = true; window.clearTimeout(timer); releaseRef.current?.(); channel?.close(); };
    }
    return () => { cancelled = true; releaseRef.current?.(); releaseRef.current = null; channel?.close(); };
  }, [attempt, projectId]);

  const takeOver = useCallback(() => {
    if (!projectId || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(PROJECT_LOCK_CHANNEL);
    channel.postMessage({ type: "takeover", projectId });
    window.setTimeout(() => { channel.close(); setAttempt((value) => value + 1); }, 250);
  }, [projectId]);

  return { state, takeOver };
}
