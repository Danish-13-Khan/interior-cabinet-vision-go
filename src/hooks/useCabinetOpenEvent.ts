import { useEffect, useRef } from "react";
import { isTauriRuntime } from "../platform/desktopFiles";

let settled: Promise<boolean> | null = null;
let settle: (opened: boolean) => void = () => undefined;
let announced = false;

/** Session restore waits for this so a Finder path is not overwritten by the last file. */
export function cabinetOpenSettled(): Promise<boolean> {
  if (!isTauriRuntime()) return Promise.resolve(false);
  if (!settled) {
    settled = new Promise((resolve) => {
      settle = resolve;
    });
  }
  return settled;
}

function announce(opened: boolean) {
  if (announced) return;
  announced = true;
  if (!settled) settled = Promise.resolve(opened);
  settle(opened);
}

export type CabinetOpenIo = {
  listen: (onPath: (path: string) => void) => Promise<() => void>;
  takePending: () => Promise<string | null>;
};

/** Listen first, then take the pending path so it cannot be opened again later. */
export async function openCabinetPathStream(io: CabinetOpenIo, onPath: (path: string) => boolean | void): Promise<{ stop: () => void; openedLaunch: boolean }> {
  let sawEvent = false;
  let accepted = false;
  const deliver = (path: string) => {
    if (!path) return;
    sawEvent = true;
    if (onPath(path) !== false) accepted = true;
  };
  const stop = await io.listen(deliver);
  const pending = await io.takePending();
  if (pending && !sawEvent) deliver(pending);
  return { stop, openedLaunch: accepted };
}

/** macOS Opened events and a second instance's forwarded path both land here. */
export function useCabinetOpenEvent(onPath: (path: string) => boolean | void) {
  const onPathRef = useRef(onPath);
  onPathRef.current = onPath;
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let stop = () => {};
    let cancelled = false;
    void (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { listen } = await import("@tauri-apps/api/event");
        const stream = await openCabinetPathStream({
          listen: async (deliver) => listen<string>("cabinet-open-path", (event) => deliver(event.payload)),
          takePending: () => invoke<string | null>("take_pending_cabinet_path"),
        }, (path) => (cancelled ? false : onPathRef.current(path)));
        if (cancelled) stream.stop();
        else stop = stream.stop;
        announce(stream.openedLaunch);
      } catch (error) {
        console.error("Could not listen for a Cabinet file open.", error);
        announce(false);
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);
}
