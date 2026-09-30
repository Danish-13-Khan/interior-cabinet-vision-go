import { useCallback, useEffect, useState } from "react";
import { reloadDraftNow } from "../domain/projectDrafts/browserSignals";
import { PROJECT_LOCK_CHANNEL, type TabLockState } from "../domain/projectDrafts/projectLock";
import { bindProjectTabLock, finishProjectTakeover, type ArmTimer, type LockBroker, type LockChannel } from "../domain/projectDrafts/tabLockController";

function armTimer(ms: number, fn: () => void) {
  const id = window.setTimeout(fn, ms);
  return { cancel: () => window.clearTimeout(id) };
}

function openChannel(): LockChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(PROJECT_LOCK_CHANNEL);
}

function lockBroker(): LockBroker | null {
  const locks = navigator.locks;
  if (!locks?.request) return null;
  return {
    request: (name, options, callback) => {
      void locks.request(name, { mode: "exclusive", ifAvailable: options.ifAvailable }, (lock) => callback(lock ? { name: lock.name } : null));
    },
  };
}

export function useProjectTabLock(projectId: string | null) {
  const [state, setState] = useState<TabLockState>("free");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    return bindProjectTabLock({
      projectId,
      locks: lockBroker(),
      openChannel,
      onState: setState,
      armTimer: armTimer satisfies ArmTimer,
    });
  }, [attempt, projectId]);

  const takeOver = useCallback(() => {
    if (!projectId) return;
    void finishProjectTakeover(projectId, openChannel, armTimer, () => reloadDraftNow(projectId)).then(() => {
      setAttempt((value) => value + 1);
    });
  }, [projectId]);

  return { state, takeOver };
}
