import { glbLoadsPending } from "./glbLoadTracker";

const nextFrame = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => resolve());
});

/**
 * A few drawn frames, then any GLBs still loading (up to 5 s), then a few more
 * frames so the light-count shader compile finishes behind the veil.
 */
export async function waitForOverviewWarm(signal: AbortSignal): Promise<void> {
  const frames = async (count: number) => {
    for (let frame = 0; frame < count && !signal.aborted; frame += 1) await nextFrame();
  };
  await frames(3);
  const deadline = performance.now() + 5000;
  while (!signal.aborted && glbLoadsPending() > 0 && performance.now() < deadline) await nextFrame();
  await frames(4);
}
