/** Time spent editing. Gaps longer than this are idle, not editing. */
export const EDITING_IDLE_GAP_MS = 60_000;

export type EditingClock = { accumulatedMs: number; lastEditAt: number | null };

/** Add the gap since the previous edit, unless the user was idle. */
export function noteEdit(clock: EditingClock, now: number, idleGapMs = EDITING_IDLE_GAP_MS): EditingClock {
  if (clock.lastEditAt == null) return { accumulatedMs: clock.accumulatedMs, lastEditAt: now };
  const gap = Math.max(0, now - clock.lastEditAt);
  const accumulatedMs = gap > idleGapMs ? clock.accumulatedMs : clock.accumulatedMs + gap;
  return { accumulatedMs, lastEditAt: now };
}

/** Due after enough editing time, not after wall-clock time with the app merely open. */
export function editingSnapshotDue(clock: EditingClock, intervalMs: number): boolean {
  return clock.accumulatedMs >= intervalMs;
}

/** Opening a different project adopts its cabinet count and must not look like the first cabinet. */
export function shouldSnapshotFirstCabinet(previousCount: number, nextCount: number, projectChanged: boolean): boolean {
  return !projectChanged && previousCount === 0 && nextCount === 1;
}
