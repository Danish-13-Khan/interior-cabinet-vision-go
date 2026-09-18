import { describe, expect, it } from "vitest";
import { resolveHeldFitSnapshot, snapshotModelViewFit } from "./modelViewFit";

describe("held Fit snapshot", () => {
  const objectA = { objectIds: ["obj-a"], wallId: null, openingId: null };
  const objectB = { objectIds: ["obj-b"], wallId: null, openingId: null };

  it("copies ids so later selection mutation cannot change the Fit target", () => {
    const live = { objectIds: ["obj-a"], wallId: null as string | null, openingId: null as string | null };
    const held = snapshotModelViewFit("selection", live);
    live.objectIds.push("obj-b");
    live.wallId = "wall-1";
    expect(held.selection).toEqual({ objectIds: ["obj-a"], wallId: null, openingId: null });
    expect(held.mode).toBe("selection");
  });

  it("keeps the fitted object after the live selection changes", () => {
    const held = snapshotModelViewFit("selection", objectA);
    const next = resolveHeldFitSnapshot({
      applyFitShot: false,
      liveMode: "selection",
      liveSelection: objectB,
      held,
    });
    expect(next.selection.objectIds).toEqual(["obj-a"]);
  });

  it("recaptures on a new Fit shot", () => {
    const held = snapshotModelViewFit("selection", objectA);
    const next = resolveHeldFitSnapshot({
      applyFitShot: true,
      liveMode: "room",
      liveSelection: objectB,
      held,
    });
    expect(next).toEqual({ mode: "room", selection: objectB });
  });
});
