import { flushDraftNow, setDraftWritesSuspended } from "./browserSignals";
import { projectLockName, type TabLockState } from "./projectLock";

export type ArmTimer = (ms: number, fn: () => void) => { cancel: () => void };
export type LockBroker = {
  request: (
    name: string,
    options: { mode: "exclusive"; ifAvailable: boolean },
    callback: (lock: { name: string } | null) => void | Promise<void>,
  ) => void;
};
export type LockChannel = {
  postMessage: (data: { type: string; projectId: string }) => void;
  addEventListener: (type: "message", handler: (event: { data?: { type?: string; projectId?: string } }) => void) => void;
  close: () => void;
};

type Session = {
  projectId: string;
  state: TabLockState;
  listeners: Set<(state: TabLockState) => void>;
  releaseLock: (() => void) | null;
  channel: LockChannel | null;
  locks: LockBroker | null;
  armTimer: ArmTimer;
  openChannel: () => LockChannel | null;
  fallback: { cancel: () => void } | null;
  grace: { cancel: () => void } | null;
};

const FALLBACK_MS = 350;
export const TAKEOVER_WAIT_MS = 8000;

/** One host is one tab. Tests use two hosts; the app uses the shared one. */
export function createTabLockHost() {
  const sessions = new Map<string, Session>();

  /** Derived from every live session: a released old project must not unblock the one opened after it. */
  function syncSuspended() {
    setDraftWritesSuspended([...sessions.values()].some((item) => item.state === "blocked" || item.state === "taken-over"));
  }

  function publish(session: Session, state: TabLockState) {
    session.state = state;
    syncSuspended();
    session.listeners.forEach((listener) => listener(state));
  }

  function releaseSession(session: Session) {
    if (session.listeners.size > 0 || !sessions.has(session.projectId)) return;
    session.releaseLock?.();
    session.releaseLock = null;
    session.fallback?.cancel();
    session.channel?.close();
    sessions.delete(session.projectId);
    publish(session, "free");
  }

  function onMessage(session: Session, event: { data?: { type?: string; projectId?: string } }) {
    const data = event.data;
    if (!data || data.projectId !== session.projectId) return;
    if (data.type === "ping" && session.state === "held") {
      session.channel?.postMessage({ type: "pong", projectId: session.projectId });
    }
    if ((data.type === "pong" || data.type === "claim") && session.state !== "held" && session.state !== "taken-over") {
      session.fallback?.cancel();
      publish(session, "blocked");
    }
    if (data.type !== "takeover" || session.state !== "held") return;
    void (async () => {
      try { await flushDraftNow(); } catch { /* the last successful draft remains */ }
      session.releaseLock?.();
      session.releaseLock = null;
      publish(session, "taken-over");
      session.channel?.postMessage({ type: "released", projectId: session.projectId });
    })();
  }

  function start(session: Session) {
    session.channel = session.openChannel();
    session.channel?.addEventListener("message", (event) => onMessage(session, event));
    if (session.locks?.request) {
      session.locks.request(projectLockName(session.projectId), { mode: "exclusive", ifAvailable: true }, (lock) => {
        if (!sessions.has(session.projectId)) return undefined;
        if (!lock) { publish(session, "blocked"); return undefined; }
        publish(session, "held");
        return new Promise<void>((resolve) => { session.releaseLock = resolve; });
      });
      return;
    }
    session.channel?.postMessage({ type: "ping", projectId: session.projectId });
    session.fallback = session.armTimer(FALLBACK_MS, () => {
      if (session.state !== "free") return;
      publish(session, "held");
      session.channel?.postMessage({ type: "claim", projectId: session.projectId });
    });
  }

  function bind(options: {
    projectId: string;
    locks: LockBroker | null;
    openChannel: () => LockChannel | null;
    onState: (state: TabLockState) => void;
    armTimer: ArmTimer;
  }): () => void {
    let session = sessions.get(options.projectId);
    if (session && session.listeners.size === 0 && session.state === "blocked") {
      session.grace?.cancel();
      session.channel?.close();
      sessions.delete(options.projectId);
      syncSuspended();
      session = undefined;
    }
    if (!session) {
      session = {
        projectId: options.projectId, state: "free", listeners: new Set(), releaseLock: null, channel: null,
        locks: options.locks, armTimer: options.armTimer, openChannel: options.openChannel, fallback: null, grace: null,
      };
      sessions.set(options.projectId, session);
      start(session);
    } else {
      session.grace?.cancel();
      session.grace = null;
    }
    session.listeners.add(options.onState);
    options.onState(session.state);
    const bound = session;
    return () => {
      bound.listeners.delete(options.onState);
      if (bound.listeners.size > 0) return;
      bound.grace = options.armTimer(0, () => releaseSession(bound));
    };
  }

  function reset() {
    for (const session of sessions.values()) {
      session.grace?.cancel();
      session.fallback?.cancel();
      session.releaseLock?.();
      session.channel?.close();
    }
    sessions.clear();
    setDraftWritesSuspended(false);
  }

  return { bind, reset };
}

const appHost = createTabLockHost();

export function bindProjectTabLock(options: Parameters<ReturnType<typeof createTabLockHost>["bind"]>[0]) {
  return appHost.bind(options);
}

export function resetProjectTabLocksForTests() {
  appHost.reset();
}

/** Wait until the holder flushes and says so. There is no fixed 250ms guess. */
export function waitForTakeoverRelease(projectId: string, openChannel: () => LockChannel | null, armTimer: ArmTimer, timeoutMs = TAKEOVER_WAIT_MS): Promise<void> {
  const channel = openChannel();
  if (!channel) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (done) return; done = true; timer.cancel(); channel.close(); resolve(); };
    const timer = armTimer(timeoutMs, finish);
    channel.addEventListener("message", (event) => {
      if (event.data?.type === "released" && event.data.projectId === projectId) finish();
    });
    channel.postMessage({ type: "takeover", projectId });
  });
}

export async function finishProjectTakeover(projectId: string, openChannel: () => LockChannel | null, armTimer: ArmTimer, reload: () => Promise<void>) {
  await waitForTakeoverRelease(projectId, openChannel, armTimer);
  await reload();
}
