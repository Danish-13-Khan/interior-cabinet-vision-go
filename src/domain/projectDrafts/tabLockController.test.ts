import { afterEach, describe, expect, it } from "vitest";
import { draftWritesSuspended, flushDraftNow, registerDraftFlush, snapshotCaptureAllowed } from "./browserSignals";
import { bindProjectTabLock, createTabLockHost, finishProjectTakeover, resetProjectTabLocksForTests, TAKEOVER_WAIT_MS, type ArmTimer, type LockBroker, type LockChannel } from "./tabLockController";

type Timer = { ms: number; fn: () => void; cancelled: boolean };

afterEach(() => resetProjectTabLocksForTests());

function timers() {
  const pending: Timer[] = [];
  const armTimer: ArmTimer = (ms, fn) => {
    const timer = { ms, fn, cancelled: false };
    pending.push(timer);
    return { cancel: () => { timer.cancelled = true; } };
  };
  return { pending, armTimer, fire(ms: number) { pending.filter((timer) => timer.ms === ms && !timer.cancelled).forEach((timer) => timer.fn()); } };
}

function memoryLocks(): LockBroker & { held: () => string | null; requests: number } {
  let holder: { name: string; release: () => void } | null = null;
  return {
    requests: 0,
    held: () => holder?.name ?? null,
    request(name, _options, callback) {
      this.requests += 1;
      if (holder) { callback(null); return; }
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      holder = { name, release };
      Promise.resolve(callback({ name })).finally(() => { if (holder?.release === release) holder = null; });
    },
  };
}

function bus() {
  const members: { handler: ((event: { data?: { type?: string; projectId?: string } }) => void) | null }[] = [];
  return {
    open(): LockChannel {
      const member = { handler: null as ((event: { data?: { type?: string; projectId?: string } }) => void) | null };
      members.push(member);
      return {
        postMessage(data) { members.forEach((other) => { if (other !== member) other.handler?.({ data }); }); },
        addEventListener(_type, handler) { member.handler = handler; },
        close() { member.handler = null; },
      };
    },
  };
}

describe("project tab lock", () => {
  it("does not block the same tab when StrictMode mounts twice", () => {
    const locks = memoryLocks();
    const clock = timers();
    const seen: string[] = [];
    const release = bindProjectTabLock({
      projectId: "proj", locks, openChannel: () => null, onState: (state) => seen.push(state), armTimer: clock.armTimer,
    });
    release();
    bindProjectTabLock({
      projectId: "proj", locks, openChannel: () => null, onState: (state) => seen.push(state), armTimer: clock.armTimer,
    });
    expect(locks.requests).toBe(1);
    expect(locks.held()).toBe("cabinet-project:proj");
    expect(seen.at(-1)).toBe("held");
    expect(snapshotCaptureAllowed()).toBe(true);
  });

  it("suspends drafts and snapshots while blocked, and only the holder answers a ping", async () => {
    const external = memoryLocks();
    external.request("cabinet-project:proj", { mode: "exclusive", ifAvailable: true }, () => new Promise(() => undefined));
    const clock = timers();
    let state = "free";
    bindProjectTabLock({
      projectId: "proj", locks: external, openChannel: () => null, onState: (next) => { state = next; }, armTimer: clock.armTimer,
    });
    expect(state).toBe("blocked");
    expect(draftWritesSuspended()).toBe(true);
    expect(snapshotCaptureAllowed()).toBe(false);

    resetProjectTabLocksForTests();
    const channel = bus();
    const tabA = createTabLockHost();
    const tabB = createTabLockHost();
    const tabC = createTabLockHost();
    const clockA = timers();
    let stateA = "free";
    tabA.bind({ projectId: "proj", locks: null, openChannel: () => channel.open(), onState: (next) => { stateA = next; }, armTimer: clockA.armTimer });
    clockA.fire(350);
    expect(stateA).toBe("held");
    const clockB = timers();
    let stateB = "free";
    tabB.bind({ projectId: "proj", locks: null, openChannel: () => channel.open(), onState: (next) => { stateB = next; }, armTimer: clockB.armTimer });
    expect(stateB).toBe("blocked");
    const clockC = timers();
    let stateC = "free";
    tabC.bind({ projectId: "other", locks: null, openChannel: () => channel.open(), onState: (next) => { stateC = next; }, armTimer: clockC.armTimer });
    expect(stateC).toBe("free");
    clockC.fire(350);
    expect(stateC).toBe("held");
  });

  it("reloads the latest draft only after the other tab has flushed", async () => {
    const locks = memoryLocks();
    const channel = bus();
    const clock = timers();
    bindProjectTabLock({ projectId: "proj", locks, openChannel: () => channel.open(), onState: () => undefined, armTimer: clock.armTimer });
    let releaseFlush: () => void = () => undefined;
    const flushed = new Promise<void>((resolve) => { releaseFlush = resolve; });
    registerDraftFlush(async () => { await flushed; });
    let reloaded = false;
    const takeover = finishProjectTakeover("proj", () => channel.open(), clock.armTimer, async () => { reloaded = true; });
    await Promise.resolve();
    expect(reloaded).toBe(false);
    expect(clock.pending.some((timer) => timer.ms === 250)).toBe(false);
    expect(clock.pending.some((timer) => timer.ms === TAKEOVER_WAIT_MS)).toBe(true);
    releaseFlush();
    await flushDraftNow();
    await takeover;
    expect(reloaded).toBe(true);
    expect(locks.held()).toBeNull();
  });
});
