import type { ShowcaseTourScheduler } from "./showcaseTourController";

/** Test-only manual clock for the tour scheduler. */
export function manualScheduler() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const scheduler: ShowcaseTourScheduler = {
    setTimeout: (callback, ms) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, callback });
      return id;
    },
    clearTimeout: (handle) => { timers.delete(handle as number); },
  };
  return {
    scheduler,
    pending: () => timers.size,
    now: () => now,
    /** Advance time, firing due timers in order (timers they schedule fire too if due). */
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].callback();
      }
      now = end;
    },
  };
}

/** Deep-freeze a document so any write during a tour throws. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
